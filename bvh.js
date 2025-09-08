let nodes = [], indices = null;

class bvhnode{
	constructor(depth){
		this.depth = depth;
		this.bounds = new aabb();
		this.mass = 0;
		this.center = new vec(0, 0);
		this.left = -1;
		this.right = -1;
	}

	is(i){
		const b = bodies[i];
		this.bounds.merge(b.p.copy().add(new vec(-b.r, -b.r)));
		this.bounds.merge(b.p.copy().add(new vec(b.r, b.r)));
		this.mass = b.m;
		this.center = b.p.copy();
		this.right = i;
	}

	merge(left, right){
		this.bounds.merge(nodes[left].bounds);
		this.bounds.merge(nodes[right].bounds);
		this.mass = nodes[left].mass + nodes[right].mass;
		this.center = (
			nodes[left].center.copy().mul(nodes[left].mass).add(
			nodes[right].center.copy().mul(nodes[right].mass))
		).div(this.mass);
		this.left = left;
		this.right = right;
	}
};

function make_bvh(){
	delete nodes;
	nodes = [];

	if(indices == null) indices = new Array(bodies.length);
	for(let i=0; i<bodies.length; ++i) indices[i] = i;

	function partition(l, r, depth){
		if(l == r-1){
			const node = new bvhnode(depth);
			node.is(indices[l]);
			nodes.push(node);
			return nodes.length-1;

		}else{
			const bounds = new aabb();
			for(let i=l; i<r; ++i) bounds.merge(bodies[indices[i]].p);

			let p = l;

			if(bounds.max.x-bounds.min.x > bounds.max.y-bounds.min.y){
				let max_idx = -1, max = -1e9;

				for(let i=l; i<r; ++i){
					if(bodies[indices[i]].p.x >= max){
						max = bodies[indices[i]].p.x;
						max_idx = i;
					}
				}

				let comp = Math.floor(Math.random()*(r-l-2)) + l;
				if(comp >= max_idx) ++comp;
				const comp2 = bodies[indices[comp]].p.x;

				for(let i=l; i<r; ++i){
					if(bodies[indices[i]].p.x < comp2 ||
					(bodies[indices[i]].p.x == comp2 && i <= comp)){
						if(p != i){
							const tmp = indices[p];
							indices[p] = indices[i];
							indices[i] = tmp;
						}
						++p;
					}
				}
			}else{
				let max_idx = -1, max = -1e9;

				for(let i=l; i<r; ++i){
					if(bodies[indices[i]].p.y >= max){
						max = bodies[indices[i]].p.y;
						max_idx = i;
					}
				}

				let comp = Math.floor(Math.random()*(r-l-2)) + l;
				if(comp >= max_idx) ++comp;
				const comp2 = bodies[indices[comp]].p.y;

				for(let i=l; i<r; ++i){
					if(bodies[indices[i]].p.y < comp2 ||
					(bodies[indices[i]].p.y == comp2 && i <= comp)){
						if(p != i){
							const tmp = indices[p];
							indices[p] = indices[i];
							indices[i] = tmp;
						}
						++p;
					}
				}
			}

			delete bounds;

			const left = partition(l, p, depth+1);
			const right = partition(p, r, depth+1);

			const node = new bvhnode(depth);
			node.merge(left, right);
			nodes.push(node);
			return nodes.length-1;
		}
	}

	partition(0, bodies.length, 0);

	delete indices;
}
