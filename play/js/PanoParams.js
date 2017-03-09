/*

This module contains functions for parsing query string arguments to determine
the specs for setting up a Pano Viewer.

Query String keywords are:

server          The server to use for mjpeg or wrtc images.  If not protocal is
                given http is assumed.
camId           If this is given, it is assumed that a dvr is being used. (The
                server keyword can be used to specify the dvr, otherwise a default
                dvr is used.
imgType         If given should be the name of one of the image types expected by
                the ImageSource class.   If not given a guess is made, or the default
                of ImageType.IMAGE (used for mjpeg) is used.

imgUrl          If given is the full URL used as argument to ImageSource.  If not
                given this is constructed from other arguments.

t               If given specifies a start time for seekable media.


Examples are

  server=panonuc2:8000                            panonuc2 Live View
  server=hw0974:8000                              HW0974 Live View
  server=dvr4:8000&camId=platonia&t=1482095123.0  Recorded platonia from DVR dvr4:8000
  camId=platonia                                  Live from platonia via default DVR
  camId=panonuc2                                  Live from platonia via default DVR
  server=panonuc2:8080&imgType=webrtc             panonuc2 Live View using WebRTC
  imgUrl=https://yuli.us/videos/test.mp4          MP4 Movie from via https


TODO:
  Some of the top level variables here should be moved into a namespace such as Pano.

*/
function report(str) {
    console.log(str);
}

getParameterByName = function(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};


function error(str)
{
    report("error: "+str);
    alert(str);
}

function getServer()
{
   var server = getParameterByName("server");
   if (server) {
      if (! (server.startsWith("http:") || server.startsWith("https:")))
         server = "http://"+server;
   }
   else {
      server = window.location.origin;
   }
   return server;
}

function getImageType()
{
    var imgType = getParameterByName("imgType");
    if (!imgType) {
        return null;
    }
    imgType = ImageSource.TYPE[imgType.toUpperCase()];
    if (!imgType) {
        error("Unknown image type "+imgType);
    }
    return imgType;
}

var server = getServer();
var defaultDVR = "http://dvr4:8000";
var imgType = getImageType();
var camId = getParameterByName("camId");
var imgUrl = getParameterByName("imgUrl");
var t = getParameterByName("t");
if (t) {
    t = JSON.parse(t);
}
report("camId: "+camId);
report("t: "+t);
function getImageSpec()
{
    if (imgUrl) {
        if (!imgType) {
            report("Assuming MP4");
            imgType = ImageSource.TYPE.VIDEO;
        }
        return {type: imgType, url: imgUrl, t: t};
    }
    if (camId) {
        report("Assuming DVR");
        var dvr = server;
        if (!dvr || dvr.startsWith("file")) {
            dvr = defaultDVR;
        }
        return { type: ImageSource.TYPE.IMAGE,
                 url: dvr+"/getImage?camId="+camId,
                 //t: t
                 startTime: t
	       }
   }
   if (imgType == null)
       imgType = ImageSource.TYPE.IMAGE;
   if (imgType == ImageSource.TYPE.IMAGE) {
       report("Assuming mjpeg server (fcProg)");
       return { type: imgType, url: server+"/getImage?camId=viewImage", t: t}
   }
   if (imgType == ImageSource.TYPE.WEBRTC) {
       report("Assuming WRTC server (fcProg)");
       if (window.location.origin.startsWith("file")) {
	   error("Can not use WebRTC via file URL");
       }
       return { type: imgType, url: server, t: t}
   }
}
