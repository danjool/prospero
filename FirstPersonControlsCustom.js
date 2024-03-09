import {
	MathUtils,
	Spherical,
	Vector3
} from 'three';

const _lookDirection = new Vector3();
const _spherical = new Spherical();
const _target = new Vector3();

class FirstPersonControlsCustom {

	constructor( object, domElement ) {
        this.object = object;
        this.domElement = domElement;
        // API
        this.enabled = true;
        this.movementSpeed = 1.0;
        this.lookSpeed = 0.005;
        this.lookVertical = true;
        this.autoForward = false;
        this.activeLook = true;
		this.mouseLook = false;
		this.deadZone = 200.;
        this.heightSpeed = false;
        this.heightCoef = 1.0;
        this.heightMin = 0.0;
        this.heightMax = 1.0;
		this.constrainHeight = false;
        this.constrainVertical = false;
        this.verticalMin = 0;
        this.verticalMax = Math.PI;
        this.mouseDragOn = false;
        // internals
        this.autoSpeedFactor = 0.0;
        this.pointerX = 0;
        this.pointerY = 0;
		this.mouseLookX = 0;
		this.mouseLookY = 0;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.viewHalfX = 0;
		this.viewHalfY = 0;
		// private variables
		let lat = 0;
		let lon = 0;
		//
		this.handleResize = function () {
			console.log('handleResize', this.domElement, this.domElement === document, window.innerWidth / 2, window.innerHeight / 2, this.domElement.offsetWidth / 2, this.domElement.offsetHeight / 2, this.domElement.offsetLeft, this.domElement.offsetTop, this.domElement.clientWidth / 2, this.domElement.clientHeight / 2, this.domElement.scrollWidth / 2, this.domElement.scrollHeight / 2, this.domElement.scrollLeft / 2, this.domElement.scrollTop / 2, this.domElement.scrollWidth / 2, this.domElement.scrollHeight / 2)
			if ( this.domElement === document ) {
                this.viewHalfX = window.innerWidth / 2;
				this.viewHalfY = window.innerHeight / 2;
			} else {
				console.log('handleResize2', this.domElement.offsetWidth, this.domElement.offsetHeight, this.domElement.offsetLeft, this.domElement.offsetTop, this.domElement.clientWidth, this.domElement.clientHeight, this.domElement.scrollWidth, this.domElement.scrollHeight, this.domElement.scrollLeft, this.domElement.scrollTop, this.domElement.scrollWidth, this.domElement.scrollHeight)
                this.viewHalfX = this.domElement.offsetWidth / 2;
				this.viewHalfY = this.domElement.offsetHeight / 2;
			}
			// if(this.deadZone !== 0){
				this.deadZone = Math.min(this.viewHalfX, this.viewHalfY) * 0.5;
				console.log('deadZone', this.deadZone)
			// }
		};

		this.onPointerDown = function ( event ) {
			if ( this.domElement !== document ) {
				this.domElement.focus();
			}
			if ( this.activeLook ) {
				switch ( event.button ) {
					case 0: this.moveForward = true; break;
					case 2: this.moveBackward = true; break;
				}
			}
			this.mouseDragOn = true;
		};

		this.onPointerUp = function ( event ) {
			if ( this.activeLook ) {
				switch ( event.button ) {
					case 0: this.moveForward = false; break;
					case 2: this.moveBackward = false; break;
				}
			}
			this.mouseDragOn = false;
		};

		this.onPointerMove = function ( event ) {
			if (this.mouseLook){ // like quake
				this.mouseLookX = ( event.movementX || event.mozMovementX || event.webkitMovementX || 0);
				this.mouseLookY = ( event.movementY || event.mozMovementY || event.webkitMovementY || 0);
				
			}
			if ( this.domElement === document ) {
				this.pointerX = event.pageX - this.viewHalfX;
				this.pointerY = event.pageY - this.viewHalfY;
				
			} else { // this one
				this.pointerX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
				this.pointerY = event.pageY - this.domElement.offsetTop - this.viewHalfY;
			}
		};

		this.onKeyDown = function ( event ) {
			switch ( event.code ) {
				case 'ArrowUp':
				case 'KeyW': this.moveForward = true; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = true; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = true; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = true; break;

				case 'KeyR': this.moveUp = true; break;
				case 'KeyF': this.moveDown = true; break;
			}
		};

		this.onKeyUp = function ( event ) {

			switch ( event.code ) {
				case 'ArrowUp':
				case 'KeyW': this.moveForward = false; break;

				case 'ArrowLeft':
				case 'KeyA': this.moveLeft = false; break;

				case 'ArrowDown':
				case 'KeyS': this.moveBackward = false; break;

				case 'ArrowRight':
				case 'KeyD': this.moveRight = false; break;

				case 'KeyR': this.moveUp = false; break;
				case 'KeyF': this.moveDown = false; break;
			}
		};

		this.lookAt = function ( x, y, z ) {
			if ( x.isVector3 ) {
				_target.copy( x );
			} else {
				_target.set( x, y, z );
			}
			this.object.lookAt( _target );
			setOrientation( this );
			return this;
		};

		this.update = function () {
			const targetPosition = new Vector3();

			return function update( delta ) {

				if ( this.enabled === false ) return;

				const actualMoveSpeed = delta * this.movementSpeed;

				if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
				if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

				if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
				if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

				if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
				if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

				if ( this.heightSpeed ) {
					const y = MathUtils.clamp( this.object.position.y, this.heightMin, this.heightMax );
					if (this.constrainHeight) this.object.position.y = y;
					const heightDelta = y - this.heightMin;
					this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );
				} else {
					this.autoSpeedFactor = 0.0;
				}

				let actualLookSpeed = delta * this.lookSpeed;

				if ( ! this.activeLook ) {
					actualLookSpeed = 0;
				}

				let verticalLookRatio = 1;

				if ( this.constrainVertical ) {
					verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );
				}

				let phi = 0; let theta = 0;
				if(this.mouseLook){
					const mouseLookSpeedMult = 4.0
					lon += this.mouseLookX * actualLookSpeed * mouseLookSpeedMult;
					if ( this.lookVertical ) lat -= this.mouseLookY * actualLookSpeed * verticalLookRatio * mouseLookSpeedMult;
					lat = Math.max( - 85, Math.min( 85, lat ) );
					phi = MathUtils.degToRad( 90 - lat );
					theta = MathUtils.degToRad( lon );
					console.log('mouseLook', actualLookSpeed, this.mouseLookX, this.mouseLookY, lon, lat, phi, theta, this.pointerX, this.pointerY, this.deadZone, this.viewHalfX, this.viewHalfY, this.domElement.offsetWidth, this.domElement.offsetHeight, this.domElement.offsetLeft, this.domElement.offsetTop, this.domElement.clientWidth, this.domElement.clientHeight, this.domElement.scrollWidth, this.domElement.scrollHeight, this.domElement.scrollLeft, this.domElement.scrollTop, this.domElement.scrollWidth, this.domElement.scrollHeight)
				} else {

					const pointDistFromCenter = Math.sqrt( this.pointerX * this.pointerX + this.pointerY * this.pointerY );
					if ( pointDistFromCenter < this.deadZone ) {
						// bail becase in dead zone
						this.pointerX = 0;
						this.pointerY = 0;
					} else if( pointDistFromCenter > 0. ) {
						// we could normalize here, so barely being out of dead zone -> low sensitivity, 
						// and being at the edge -> high sensitivity // but the math lends itself to errors
					}
					lon -= this.pointerX * actualLookSpeed;
					if ( this.lookVertical ) lat -= this.pointerY * actualLookSpeed * verticalLookRatio;
					lat = Math.max( - 85, Math.min( 85, lat ) );
					phi = MathUtils.degToRad( 90 - lat );
					theta = MathUtils.degToRad( lon );
				}

				

				if ( this.constrainVertical ) {
					phi = MathUtils.mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );
				}

				const position = this.object.position;
				targetPosition.setFromSphericalCoords( 1, phi, theta ).add( position ); // phi and theta end up driving the look direction, phi is up and down, theta is left and right
				this.object.lookAt( targetPosition );

			};

		}();

		this.dispose = function () {
			this.domElement.removeEventListener( 'contextmenu', contextmenu );
			this.domElement.removeEventListener( 'pointerdown', _onPointerDown );
			this.domElement.removeEventListener( 'pointermove', _onPointerMove );
			this.domElement.removeEventListener( 'pointerup', _onPointerUp );
			window.removeEventListener( 'keydown', _onKeyDown );
			window.removeEventListener( 'keyup', _onKeyUp );

		};

		const _onPointerMove = this.onPointerMove.bind( this );
		const _onPointerDown = this.onPointerDown.bind( this );
		const _onPointerUp = this.onPointerUp.bind( this );
		const _onKeyDown = this.onKeyDown.bind( this );
		const _onKeyUp = this.onKeyUp.bind( this );

		this.domElement.addEventListener( 'contextmenu', contextmenu );
		this.domElement.addEventListener( 'pointerdown', _onPointerDown );
		this.domElement.addEventListener( 'pointermove', _onPointerMove );
		this.domElement.addEventListener( 'pointerup', _onPointerUp );

		window.addEventListener( 'keydown', _onKeyDown );
		window.addEventListener( 'keyup', _onKeyUp );

		function setOrientation( controls ) {
			const quaternion = controls.object.quaternion;
			_lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
			_spherical.setFromVector3( _lookDirection );
			lat = 90 - MathUtils.radToDeg( _spherical.phi );
			lon = MathUtils.radToDeg( _spherical.theta );
		}

		this.handleResize();
		setOrientation( this );
	}
}

function contextmenu( event ) {
	event.preventDefault();
}

export { FirstPersonControlsCustom };
