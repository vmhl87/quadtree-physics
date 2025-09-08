const n = 2000,
	precision = Math.pow(2.0, 2),
	elastic = 0.75 + 1.0,
	density = 20;

let zoom = 1.0;

class body{
	constructor(p, v, r){
		this.p = p;
		this.v = v;
		this.r = r;
		this.m = r*r * density;

		this.a = new vec(0, 0);
		this.temp = 0;
	}
};

let bodies = [];

function setup(){
	createCanvas(600, 600);

	for(let i=0; i<n; ++i){
		const theta = Math.random() * Math.PI * 2.0;
		const s = Math.sin(theta), c = Math.cos(theta);

		const r = Math.sqrt(Math.random())*80;

		bodies.push(new body(
			new vec(c, s).mul(r),
			new vec(-s, c).mul(r/2.7),
			1.0 + Math.random(),
		));
	}

	setTimeout(() => {
		bodies.push(new body(
			new vec(300, 300),
			new vec(-4500, -4500),
			2
		));
		bodies.push(new body(
			new vec(-300, 300),
			new vec(4500, -4500),
			2
		));
		bodies.push(new body(
			new vec(300, -300),
			new vec(-4500, 4500),
			2
		));
		bodies.push(new body(
			new vec(-300, -300),
			new vec(4500, 4500),
			2
		));
	}, 4000);
}

let last_time = -1, fps = 0, last_fps = 0, lm = [0, 0], tran = [0, 0];

function draw(){
	background(215);

	const dt = last_time < 0 || Date.now() - last_time > 1000 ? 0 : (Date.now()-last_time) / 1e3;
	last_time = Date.now();

	make_bvh();

	for(let i=0; i<bodies.length; ++i){
		if(bodies[i].p.x < -width/2+bodies[i].r-0.001){
			bodies[i].p.x = -width/2+bodies[i].r;
			bodies[i].v.x = Math.abs(bodies[i].v.x);
		}

		if(bodies[i].p.y < -height/2+bodies[i].r-0.001){
			bodies[i].p.y = -height/2+bodies[i].r;
			bodies[i].v.y = Math.abs(bodies[i].v.y);
		}

		if(bodies[i].p.x > width/2-bodies[i].r+0.001){
			bodies[i].p.x = width/2-bodies[i].r;
			bodies[i].v.x = -Math.abs(bodies[i].v.x);
		}

		if(bodies[i].p.y > height/2-bodies[i].r+0.001){
			bodies[i].p.y = height/2-bodies[i].r;
			bodies[i].v.y = -Math.abs(bodies[i].v.y);
		}

		const target = new aabb();
		target.merge(bodies[i].p.copy().add(new vec(-bodies[i].r, -bodies[i].r)));
		target.merge(bodies[i].p.copy().add(new vec(bodies[i].r, bodies[i].r)));

		let queue = [nodes.length-1];

		for(let p=0; p<queue.length; ++p){
			const node = nodes[queue[p]];

			if(!target.touch(node.bounds)){
				const num = node.bounds.max.x+node.bounds.max.y-node.bounds.min.x-node.bounds.min.y;
				const densq = bodies[i].p.distsq(node.center);

				if(num*num < precision*densq){
					const v = bodies[i].p.copy().sub(node.center);
					const d = v.magsq(), sd = Math.sqrt(d);
					bodies[i].a.add(v.copy().mul(-node.mass/d/sd));
					continue;
				}
			}

			if(node.left == -1){
				const j = node.right;
				if(i == j) continue;
				const v = bodies[i].p.copy().sub(bodies[j].p);
				const d = v.mag();
				bodies[i].a.add(v.copy().mul(-bodies[j].m/d/d/d));
				if(d < bodies[i].r+bodies[j].r-0.001){
					const gap = Math.max(0, bodies[i].r+bodies[j].r-d-2.25);
					bodies[i].temp = Math.min(1, bodies[i].temp+gap/4);
					bodies[j].temp = Math.min(1, bodies[i].temp+gap/4);
					v.div(d);
					const d1 = bodies[i].v.dot(v);
					const d2 = bodies[j].v.dot(v);
					const d3 = (d1*bodies[i].m+d2*bodies[j].m)/(bodies[i].m+bodies[j].m);
					bodies[i].v.add(v.copy().mul((d3-d1)*elastic));
					bodies[j].v.add(v.copy().mul((d3-d2)*elastic));
					const d4 = (bodies[i].r+bodies[j].r-d)/2;
					bodies[i].p.add(v.copy().mul(d4));
					bodies[j].p.add(v.copy().mul(-d4));
				}

			}else queue.push(node.left, node.right);
		}
	}

	for(const b of bodies){
		b.p.add(b.v.copy().mul(dt));
		b.v.add(b.a.mul(dt));
		b.a.x = 0, b.a.y = 0;
	}

	push();

	translate(width/2, height/2);

	scale(zoom, zoom);

	if(mouseIsPressed){
		tran[0] += (mouseX-lm[0])/zoom;
		tran[1] += (mouseY-lm[1])/zoom;
	}

	lm = [mouseX, mouseY];

	translate(tran[0], tran[1]);

	fill(225); noStroke();
	rect(-width/2, -height/2, width, height);

	let vel = new vec(0, 0);

	for(const b of bodies){
		const F = b.temp; b.temp = Math.max(0, b.temp - dt*3);
		const col = [ 0, 175, 225 ];
		fill(lerp(50, col[0], F), lerp(50, col[1], F), lerp(50, col[2], F));
		noStroke(); circle(b.p.x, b.p.y, b.r*2);
		vel.add(b.v);
	}

	if(vel.div(bodies.length).mag() > 300){
		for(const b of bodies){
			b.v.mul(0.95);
		}
	}

	pop();

	if(Date.now() > last_fps + 200){
		last_fps = Date.now();
		fps = Math.round(frameRate()*10)/10;
	}

	fill(50); stroke(225);
	textAlign(LEFT, TOP);
	textSize(13);
	text(`fps: ${fps}`, 10, 10);
}

function mouseWheel(e){
	if(e.delta > 0) zoom *= 0.95;
	else zoom /= 0.95;

	if(zoom < 1.0){
		zoom = 1.0;
		const d = new vec(...tran);
		if(d.mag() == 0) return;
		const v = Math.min(30, d.mag());
		d.norm().mul(-v);
		tran[0] += d.x;
		tran[1] += d.y;
	}
}
