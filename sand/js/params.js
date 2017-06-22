
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
    }
}

var params = paramsDefault;


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
        editor.set(params);
        editor.expandAll();
        $('#config').modal();
    }
});

function updateParams(newParams) {
    params = newParams;
    localStorage.setItem('params', JSON.stringify(params));
    resetApp();
}