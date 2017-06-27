
var paramsDefault = {
    labelSize: 60,
    gridLineWidth: 5,
    chartGridLineWidth: 3,
    envelopeLineWidth: 3,
    refLineWidth: 3,
    co2LineWidth: 20,
    tempLineWidth: 60,
    balanceLineWidth: 30,
    hideLegend: false,
    showPanel: true,
    showGraphics: true,
    showVideo: false,

    colors: {
        x: '#FF4136',
        y: '#2ECC40',
        z: '#0074D9',
        bg: '#303025',
        // bg: '#FFFFFF'
    },

    capturer: {
        name: 'climate-trend',
        width: 3840,
        height: 2160,
        framerate: 30,
        format: 'png',
        timeLimit: 1200,
        startTime: 0,
        autoSaveTime: 60,
        display: true,
        reset: true
    }
}

var params = paramsDefault;
var storedParams = localStorage.getItem('params');
if (storedParams) {
    params = JSON.parse(storedParams);
}


var container = document.getElementById("jsoneditor");
var options = {
    mode: 'tree',
    modes: ['code', 'tree'], // allowed modes
};
var editor = new JSONEditor(container, options);


$('#config-save').click(function() {
        var json = editor.get();
        console.log(JSON.stringify(json, null, 2));
        updateParams(json);
});

$('#config-reset').click(function() {
    editor.set(paramsDefault);
    editor.expandAll();
    updateParams(paramsDefault);
});

$(document.body).keyup(function(e) {
    if (e.keyCode == 32) {
        // space
        editor.set(params);
        editor.expandAll();
        $('#config').modal();
    } else if (e.keyCode == 88) {
        // X - stop recording
        if (capturer) {
            three.off('update', renderCapture);
            capturer.stop();
            capturer.save();
            capturer = null;
        }
    }
});

function updateParams(newParams) {
    params = newParams;
    localStorage.setItem('params', JSON.stringify(params));
    resetApp();
}

// recording

var capturer;

$('#config').on('show.bs.modal', function() {
    var form = $('#recording-form');
    form.find('[name=name]').val(params.capturer.name);
    form.find('[name=width]').val(params.capturer.width);
    form.find('[name=height]').val(params.capturer.height);
    form.find('[name=framerate]').val(params.capturer.framerate);
    form.find('[name=format]').val(params.capturer.format);
    form.find('[name=timeLimit]').val(params.capturer.timeLimit);
    form.find('[name=startTime]').val(params.capturer.startTime);
    form.find('[name=autoSaveTime]').val(params.capturer.autoSaveTime);
    form.find('[name=display]').prop('checked', params.capturer.display);
    form.find('[name=reset]').prop('checked', params.capturer.reset);
});

$('#start-recording').click(function() {
    var form = $('#recording-form');
    params.capturer.name = form.find('[name=name]').val();
    params.capturer.width = parseInt(form.find('[name=width]').val()) || paramsDefault.capturer.width;
    params.capturer.height = parseInt(form.find('[name=height]').val()) || paramsDefault.capturer.height;    
    params.capturer.framerate = parseInt(form.find('[name=framerate]').val()) || paramsDefault.capturer.framerate;
    params.capturer.format = form.find('[name=format]').val();
    params.capturer.timeLimit = parseInt(form.find('[name=timeLimit]').val()) || 0;
    params.capturer.startTime = parseInt(form.find('[name=startTime]').val()) || 0;
    params.capturer.autoSaveTime = parseInt(form.find('[name=autoSaveTime]').val()) || 0;
    params.capturer.display = form.find('[name=display]').prop('checked');
    params.capturer.reset = form.find('[name=reset]').prop('checked');

    var options = {
        motionBlurFrames: 0,
        name: params.capturer.name,
        framerate: params.capturer.framerate,
        format: params.capturer.format,
        timeLimit: params.capturer.timeLimit,
        autoSaveTime: params.capturer.autoSaveTime,
        timeStart: params.capturer.timeStart,
        display: params.capturer.display,
        reset: params.capturer.reset
    };

    clearEvents();

    capturer = new CCapture(options);
    capturer.start();

    if (params.capturer.reset) {
        resetApp();
    }


    // force resize
    var w = params.capturer.width;
    var h = params.capturer.height;
    three.trigger({
        type: 'resize',
        renderWidth: w,
        renderHeight: h,
        viewWidth: w,
        viewHeight: h,
        aspect: w/h,
        pixelRatio: 1
    });
    $(three.renderer.domElement).css({width: w, height: h});

    // three.off('update', renderCapture);
    // three.on('update', renderCapture);

    renderCapture();
});

function renderCapture() {
    if (capturer && three) {
        requestAnimationFrame(renderCapture);
        renderPanel();
        capturer.capture(three.renderer.domElement);
    }
}

function renderPanel() {
    if (!three) {
        return;
    }

    var canvas = three.renderer.domElement;
    var ctx = canvas.getContext("2d");
    var data = "data:image/svg+xml," +
            "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
                "<foreignObject width='100%' height='100%'>" +
                // $('#panel')[0].innerHTML +
                "<div xmlns='http://www.w3.org/1999/xhtml' style='font-size:12px'>" +
                    "<ul> <li style='color:red'> hello </li>  <li style='color:green'>thomas</li> </ul> "  +   
                "</div>" +
                "</foreignObject>" +
            "</svg>";

    var img = new Image();
    img.src = data;
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    }

}