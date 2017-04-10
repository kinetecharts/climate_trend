AFRAME.registerComponent('bvh-loader', {
	schema: {
		src:         { type: 'string' },
		crossorigin: { default: '' }
	},

	init: function () {
		this.skeletonHelper = null;
		this.boneContainer = null;
	},

	update: function () {
		var loader, data = this.data;
		if (!data.src) return;

		this.remove();
		
		loader = new THREE.BVHLoader();
		// if (data.crossorigin) loader.setCrossOrigin(data.crossorigin);
		loader.load(data.src, this.load.bind(this));
	},

	load: function (result) {
		this.skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
		this.skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to SkeletonHelper directly

		this.boneContainer = new THREE.Group();
		this.boneContainer.add( result.skeleton.bones[ 0 ] );

		this.el.setObject3D('skeletonHelper', this.skeletonHelper);
		this.el.setObject3D('boneContainer', this.boneContainer);

		// play animation
		var mixer = new THREE.AnimationMixer( this.skeletonHelper );
		mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();
	},

	remove: function () {
		if (this.boneContainer) this.el.removeObject3D('boneContainer');
		if (this.skeletonHelper) this.el.removeObject3D('skeletonHelper');
	}
});