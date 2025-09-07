class vec{
	constructor(x, y){
		this.x = x;
		this.y = y;
		return this;
	}

	copy(){
		return new vec(this.x, this.y);
	}

	add(o){
		this.x += o.x;
		this.y += o.y;
		return this;
	}

	sub(o){
		this.x -= o.x;
		this.y -= o.y;
		return this;
	}

	mul(o){
		if(o instanceof vec){
			this.x *= o.x;
			this.y *= o.y;
		}else if(typeof o == "number"){
			this.x *= o;
			this.y *= o;
		}
		return this;
	}

	div(o){
		if(o instanceof vec){
			this.x /= o.x;
			this.y /= o.y;
		}else if(typeof o == "number"){
			this.x /= o;
			this.y /= o;
		}
		return this;
	}

	dot(o){
		return this.x*o.x + this.y*o.y;
	}

	magsq(){
		return this.dot(this);
	}

	mag(){
		return Math.sqrt(this.magsq());
	}

	norm(){
		this.div(this.mag());
		return this;
	}

	distsq(o){
		return (this.x-o.x)*(this.x-o.x) + (this.y-o.y)*(this.y-o.y);
	}

	dist(o){
		return Math.sqrt(this.distsq(o));
	}
};

class aabb{
	constructor(){
		this.min = new vec(1e9, 1e9);
		this.max = new vec(-1e9, -1e9);
	}

	merge(v){
		if(v instanceof aabb){
			this.min.x = Math.min(this.min.x, v.min.x);
			this.min.y = Math.min(this.min.y, v.min.y);
			this.max.x = Math.max(this.max.x, v.max.x);
			this.max.y = Math.max(this.max.y, v.max.y);
		}

		if(v instanceof vec){
			this.min.x = Math.min(this.min.x, v.x);
			this.min.y = Math.min(this.min.y, v.y);
			this.max.x = Math.max(this.max.x, v.x);
			this.max.y = Math.max(this.max.y, v.y);
		}
	}

	touch(v){
		if(v instanceof vec){
			return v.x >= this.min.x && v.x <= this.max.x &&
				v.y >= this.min.y && v.y <= this.max.y;
		}

		if(v instanceof aabb){
			return v.max.x >= this.min.x && v.min.x <= this.max.x &&
				v.max.y >= this.min.y && v.min.y <= this.max.y;
		}
	}
};
