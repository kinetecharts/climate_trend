
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
        width: 3840,
        height: 2160,
        framerate: 30,
        format: 'webm-mediarecorder',
        timeLimit: null,
        startTime: null,
        display: false,
        reset: false
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
    form.find('[name=width]').val(params.capturer.width);
    form.find('[name=height]').val(params.capturer.height);
    form.find('[name=framerate]').val(params.capturer.framerate);
    form.find('[name=format]').val(params.capturer.format);
    form.find('[name=timeLimit]').val(params.capturer.timeLimit);
    form.find('[name=startTime]').val(params.capturer.startTime);
    form.find('[name=display]').prop('checked', params.capturer.display);
    form.find('[name=reset]').prop('checked', params.capturer.reset);
});

$('#start-recording').click(function() {
    var form = $('#recording-form');
    params.capturer.width = parseInt(form.find('[name=width]').val()) || paramsDefault.capturer.width;
    params.capturer.height = parseInt(form.find('[name=height]').val()) || paramsDefault.capturer.height;    
    params.capturer.framerate = parseInt(form.find('[name=framerate]').val()) || paramsDefault.capturer.framerate;
    params.capturer.format = form.find('[name=format]').val();
    params.capturer.timeLimit = parseInt(form.find('[name=timeLimit]').val()) || 0;
    params.capturer.startTime = parseInt(form.find('[name=startTime]').val()) || 0;
    params.capturer.display = form.find('[name=display]').prop('checked');
    params.capturer.reset = form.find('[name=reset]').prop('checked');

    var options = {
        framerate: params.capturer.framerate,
        format: params.capturer.format,
        timeLimit: params.capturer.timeLimit,
        timeStart: params.capturer.timeStart,
        display: params.capturer.display,
        reset: params.capturer.reset
    };

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

    if (params.capturer.reset) {
        resetApp();
    }

    capturer = new CCapture(options);
    capturer.start();

    three.off('update', renderCapture);
    three.on('update', renderCapture);
});

function renderCapture() {
    if (capturer && three) {
        capturer.capture(three.renderer.domElement);
    }
}
