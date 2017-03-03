uniform float t;
attribute float size;
attribute float alpha;
attribute vec3 customColor;
attribute vec3 ringColor;

attribute float year;
attribute float temperature;
attribute float precipitation;
attribute float seaIceFraction;
attribute float cO2Concentration;

varying vec3 vColor;
varying vec3 rColor;
varying float vAlpha;

void main() {
	float pi = 3.1415926;
  vColor = customColor;
  rColor = ringColor;
  vAlpha = alpha;
  vec3 pos = position;
  // z => year
  // y => value
  // x => width
  // pos.y += sin(t/100.0)*10.0;
  pos.y = pos.y; // + sin(pos.z/10.0 + t/100.0) * 1.0 ;

  pos.x = pos.x + sin(pos.x * 0.05 * 1.5*pi + t/100.0 + pos.z/10.0);

  vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
  gl_PointSize = size * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
