varying vec4 vColor;
varying float z;
varying vec3 vNormal;

uniform vec3 color;

void main() {
	vec4 light = vec4(0.8, 0.8, 0.8, 1.0);
	vec3 lightColor = vec3(0.0, 1.0, 0.0);
	vec3 direction = normalize(vec3(1.0, 1.0, 0.2));
	// Fake colors for now
	float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
	// vec3 shade = clamp(dot(direction, vNormal)) * lightColor;
	// vec3 shade = (dot(direction, vNormal)) * lightColor;
	gl_FragColor = abs(vec4(vNormal, 1.));
	// gl_FragColor = vec4(shade + vec3(z2, z2, z2), 1.);
	// gl_FragColor = vec4( z2, z2, z2, 1. );
}