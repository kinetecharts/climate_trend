uniform vec3 color;
uniform sampler2D texture;
varying vec3 vColor;
varying vec3 rColor;
varying float vAlpha;

void main() {
  // gl_FragColor = vec4( color * vColor, 1.0 );
  gl_FragColor = vec4(gl_PointCoord.s, gl_PointCoord.t, 0, vAlpha);
  float len = length(gl_PointCoord- vec2(0.5, 0.5));
  if(len < 0.2){
    // gl_FragColor=vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor=vec4(vColor, vAlpha);
    // gl_FragColor.a=0;
  }else if(len < 0.5){
    // gl_FragColor = vec4(0, 1, 0, 1);
    gl_FragColor = vec4(rColor, vAlpha);
    gl_FragColor.a = (0.5 - len) * 3.0;
  }else{
    gl_FragColor.a = 0.0;
  }
  // gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
  if ( gl_FragColor.a < ALPHATEST ) discard;
}