/**
 * Wrapper to create three.js texture from multiple different sources.
 * 
 * @class
 * @constructor
 */
function ImageSource(options) {
    this.options = options;

    this.url = this.options.url;
    this.type = this.options.type || this.TYPE.NONE;
    this.startTime = this.options.startTime || 0;
    this.video = document.createElement('video');
    this.video.setAttribute('crossorigin', 'anonymous');
    this.video.autoplay = true;
    this.manager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.manager);
    this.prevTexture = null;

    this.imNum = 0;
    this.playTime = null;
    this.lastSeekTime = null;
    this.t0 = null;
    this.playSpeed = 1.0;
    this.lastMark = null;
    this.running = false;
}



/**
 * Source types
 * @readonly
 * @enum {number}
 */    
ImageSource.TYPE = {
    /** No source type */
    NONE: 0,
    /** WebRTC server source */
    WEBRTC: 1,
    /** Motion JPEG source from fcProg server */
    VIDEO: 2,
    /** Poll image url. Parameter t is appended to the url starting with startTime in options */
    IMAGE: 3
};

ImageSource.prototype.setMark = function(t) {
    if (!t) {
        //t = getClockTime(t);
        t = this.getPlayTime();
    }
    report("setMark "+t);
    this.lastMark = t;
};

ImageSource.prototype.gotoMark = function() {
    var t = this.lastMark;
    report("gotoMark t: "+t);
    this.setPlayTime(t);
};

ImageSource.prototype.goBack = function() {
    var t = this.getPlayTime();
    if (t == null) {
	report("No play time");
	return;
    }
    this.setPlayTime(t-1);
};

ImageSource.prototype.goForward = function() {
    var t = this.getPlayTime();
    if (t == null) {
	report("No play time");
	return;
    }
    this.setPlayTime(t+1);
};

ImageSource.prototype.setPlaySpeed = function(s) {
    report("ImageSource.setPlaySpeed "+s);
    this.playSpeed = s;
    if (this.video)
	this.video.playbackRate = s;
}

ImageSource.prototype.getPlaySpeed = function() {
    report("ImageSource.getPlaySpeed --> "+this.playSpeed);
    return this.playSpeed;
}

ImageSource.prototype.pause = function() {
    if (this.video)
	this.video.pause();
    else
	report("*** no video ***");
};

ImageSource.prototype.play = function() {
    if (this.video)
	this.video.play();
    else
	report("*** no video ***");
};

ImageSource.prototype.setRealTime = function() {
    this.setPlayTime(null);
};

ImageSource.prototype.setPlayTime = function(t) {
    if (t == null) {
        report("*** set real time ***");
        this.playTime = null
        this.lastSeekTime = null;
        return;
    }
    if (t < 0)
        t = getClockTime() - t;
    this.playTime = t;
    this.lastSeekTime = getClockTime();
    if (this.type == ImageSource.TYPE.VIDEO) {
	if (this.video) {
            //this.video.seek(t);
	    report("*** setting video.currentTime to "+t);
            this.video.currentTime = t;
	}
	else {
	    report("*** No video yet ***");
	}
    }
};

ImageSource.prototype.getPlayTime = function() {
    var t = getClockTime();
    var dt = t - this.lastSeekTime;
    if (this.type == ImageSource.TYPE.VIDEO) {
	if (this.video) {
	    this.playTime = this.video.currentTime;
	}
	else {
	    report("*** No video yet ***");
	}
    }
    else {
	this.playTime += this.playSpeed*dt;
    }
    this.lastSeekTime = t;
    return this.playTime;
};

/**
 * Get URL for fetching next image.
 * 
 * @method
 * @return {URL} Returns a URL as string;
 */
ImageSource.prototype.getImageUrl = function()
{
    this.imNum += 1;
    if (this.playTime == null) { // real time
	// note 'uniq' is used to avoid caching.
	// The dvr should ignore that and give most recent if no time is given.
        return this.url + "&uniq="+getClockTime();
    }
    //return this.imageUrl + "&t="+this.getPlayTime();
    return this.url + "&t="+this.getPlayTime();
}

/**
 * Create a texture based on the source type
 * 
 * @method
 * @return {Object} Returns a THREE.Texture object
 */
ImageSource.prototype.createTexture = function() {
    var texture;
    var scope = this;
    if (this.type == ImageSource.TYPE.NONE) {
        texture = new THREE.Texture();
    } else if (this.type == ImageSource.TYPE.WEBRTC) {
        texture = new THREE.Texture();
        texture.generateMipmaps = false;
        var client = new JCClient(this.url);
        client.on('ready', function(video) {
            scope.video = video;
            texture.image = video;

		    function update() {
			    requestAnimationFrame(update);
			    if (video.readyState >= video.HAVE_CURRENT_DATA) {
				    texture.needsUpdate = true;
			    }
		    }
		    update();
        });
    } else if (this.type == ImageSource.TYPE.VIDEO) {
        this.video.src = this.url;
        this.video.loop = true;
        this.video.load();
        this.video.play();
        texture = new THREE.VideoTexture(this.video);
    } else if (this.type == ImageSource.TYPE.IMAGE) {
        texture = new THREE.Texture();
    }
    this.texture = texture;
    texture.minFilter = THREE.LinearFilter;
    return texture;
};

/**
 * Update the texture.  Note that this function calls itself
 * (as long as pano.running is true) since its not possible to
 * know synchronously when images have been updated.
 */
ImageSource.prototype.updateTexture = function() {
    if (this.type != ImageSource.TYPE.IMAGE) {
	report("updateTexture only used for TYPE.IMAGE");
	return;
    }
    var inst = this;
    var texture = this.texture;
    //this.textureLoader.load(this.url + '&t=' + t, function(tex) {
    var url = inst.getImageUrl();
    if (verbosity > 1)
        report("updateTexture url: "+url);
    this.textureLoader.load(url,
        function(tex) {
            texture.format = tex.format;
            texture.image = tex.image;
            texture.needsUpdate = true;
            if (this.prevTexture) {
	        //report("Disposing of previous texture...");
	        this.prevTexture.dispose();
	    }
	    this.prevTexture = tex;
	    if (inst.running)
	        inst.updateTexture();
        },
	null,
        function(xhr) {
            if (inst.running) {				
                report("failed on texture load... retrying...");
                setTimeout(function() { inst.updateTexture(); }, 500);
	    }
	}
   );
}

ImageSource.prototype.start = function()
{
    report("ImageSource.start...");
//    xxxx.yyyy.ddd;
    if (this.startTime)
	this.setPlayTime(this.startTime);
    this.running = true;
    setTimeout(this.updateTexture(), 1000);
}

ImageSource.prototype.stop = function()
{
    this.running = false;
}

