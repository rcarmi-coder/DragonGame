extends SceneTree

func _init():
	print("Testing FastNoiseLite terrain generation...")
	var noise = FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.frequency = 0.0015
	noise.fractal_octaves = 5
	noise.fractal_gain = 0.5
	noise.fractal_lacunarity = 2.0
	
	var st = SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var grid_size = 50
	var step = 40.0
	for z in range(grid_size):
		for x in range(grid_size):
			var px = (x - grid_size / 2.0) * step
			var pz = (z - grid_size / 2.0) * step
			var h = noise.get_noise_2d(px, pz) * 150.0
			st.set_uv(Vector2(float(x) / grid_size, float(z) / grid_size))
			st.add_vertex(Vector3(px, h, pz))
	
	for z in range(grid_size - 1):
		for x in range(grid_size - 1):
			var i0 = z * grid_size + x
			var i1 = i0 + 1
			var i2 = (z + 1) * grid_size + x
			var i3 = i2 + 1
			st.add_index(i0)
			st.add_index(i2)
			st.add_index(i1)
			st.add_index(i1)
			st.add_index(i2)
			st.add_index(i3)
			
	st.generate_normals()
	var mesh = st.commit()
	print("Mesh generated with vertices: ", mesh.get_faces().size())
	quit()
