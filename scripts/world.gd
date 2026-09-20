extends Node3D

@onready var sun_light = $DirectionalLight3D
@onready var terrain_node = $Terrain
@onready var trees_node = $Trees
@onready var towers_node = $Towers

var noise: FastNoiseLite
var ridge_noise: FastNoiseLite
var terrain_mesh: ArrayMesh

# Parámetros del terreno (3600m x 3600m)
const WORLD_SIZE = 3600.0
const GRID_RES = 100
const STEP = WORLD_SIZE / float(GRID_RES)

func _ready():
	add_to_group("world")
	init_noise()
	generate_mountain_terrain()
	generate_glacial_lake()
	spawn_dense_conifer_forest()
	spawn_medieval_towers()
	spawn_knights()
	spawn_rey_supremo()

func init_noise():
	noise = FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.seed = 1337
	noise.frequency = 0.0009
	noise.fractal_octaves = 4
	noise.fractal_gain = 0.5
	noise.fractal_lacunarity = 2.0
	
	ridge_noise = FastNoiseLite.new()
	ridge_noise.noise_type = FastNoiseLite.TYPE_PERLIN
	ridge_noise.seed = 4242
	ridge_noise.frequency = 0.0018
	ridge_noise.fractal_octaves = 4

# Función matemática de altura del terreno queryable en cualquier punto (x, z)
func get_height(x: float, z: float) -> float:
	# Valle central más suave (donde vuelan y aterrizan cómodamente)
	var dist_from_center = Vector2(x, z).length()
	var center_valley_factor = smoothstep(200.0, 900.0, dist_from_center)
	
	# Base ondulada continental
	var base_h = noise.get_noise_2d(x, z) * 90.0 + 45.0
	
	# Crestas filosas y escarpadas (como en Foto 4)
	var r = 1.0 - abs(ridge_noise.get_noise_2d(x, z))
	var ridge_h = pow(r, 2.8) * 280.0 * center_valley_factor
	
	# Cumbre suprema en el noreste (X=600, Z=600, como en Foto 5)
	var summit_dist = Vector2(x - 600.0, z - 600.0).length()
	var summit_h = max(0.0, 1.0 - (summit_dist / 650.0)) * 260.0
	
	# Cuenca del lago glacial (depresión en X=450, Z=450)
	var lake_dist = Vector2(x - 450.0, z - 450.0).length()
	if lake_dist < 180.0:
		var lake_bowl = (1.0 - (lake_dist / 180.0)) * 60.0
		summit_h -= lake_bowl
		
	# Borde montañoso perimetral infinito para cerrar el horizonte
	var rim_factor = smoothstep(1200.0, 1800.0, dist_from_center) * 220.0
	
	return max(8.0, base_h + ridge_h + summit_h + rim_factor)

func generate_mountain_terrain():
	var st = SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var half_size = WORLD_SIZE * 0.5
	var u_step = 1.0 / float(GRID_RES)
	
	for z_idx in range(GRID_RES + 1):
		var pz = -half_size + z_idx * STEP
		var v_coord = float(z_idx) * u_step
		for x_idx in range(GRID_RES + 1):
			var px = -half_size + x_idx * STEP
			var u_coord = float(x_idx) * u_step
			var py = get_height(px, pz)
			st.set_uv(Vector2(u_coord, v_coord))
			st.add_vertex(Vector3(px, py, pz))
			
	for z_idx in range(GRID_RES):
		for x_idx in range(GRID_RES):
			var i0 = z_idx * (GRID_RES + 1) + x_idx
			var i1 = i0 + 1
			var i2 = (z_idx + 1) * (GRID_RES + 1) + x_idx
			var i3 = i2 + 1
			
			st.add_index(i0)
			st.add_index(i2)
			st.add_index(i1)
			
			st.add_index(i1)
			st.add_index(i2)
			st.add_index(i3)
			
	st.generate_normals()
	terrain_mesh = st.commit()
	
	# Asignar material con shader de nieve y roca
	var mat = preload("res://shaders/snow_terrain.gdshader")
	var shader_mat = ShaderMaterial.new()
	shader_mat.shader = mat
	shader_mat.set_shader_parameter("snow_height_threshold", 140.0)
	shader_mat.set_shader_parameter("snow_slope_threshold", 0.52)
	terrain_mesh.surface_set_material(0, shader_mat)
	
	terrain_node.mesh = terrain_mesh
	
	# Colisión física trimesh para colisiones y aterrizaje exacto
	var col_shape = terrain_node.get_node_or_null("StaticBody3D/CollisionShape3D")
	if col_shape:
		col_shape.shape = terrain_mesh.create_trimesh_shape()

func generate_glacial_lake():
	# Lago alpino glacial de aguas profundas oscuras (como en Foto 5)
	var lake = MeshInstance3D.new()
	var plane = PlaneMesh.new()
	plane.size = Vector2(280.0, 220.0)
	lake.mesh = plane
	lake.position = Vector3(450.0, 152.0, 450.0)
	
	var lake_shader = preload("res://shaders/glacial_water.gdshader")
	var mat = ShaderMaterial.new()
	mat.shader = lake_shader
	lake.set_surface_override_material(0, mat)
	add_child(lake)

func spawn_dense_conifer_forest():
	# Generar cientos de árboles perfectamente apoyados sobre el relieve del terreno (Fotos 1 y 2)
	var tree_scene = preload("res://scenes/tree.tscn")
	var rng = RandomNumberGenerator.new()
	rng.seed = 98765
	
	# Bosque interactivo destructible (120 pinos interactivos en el valle)
	for i in range(120):
		var angle = rng.randf() * TAU
		var dist = rng.randf_range(50.0, 750.0)
		var x = cos(angle) * dist
		var z = sin(angle) * dist
		var y = get_height(x, z)
		
		# No colocar árboles dentro del lago o en cumbres de nieve (> 140m)
		if y < 135.0:
			var tree = tree_scene.instantiate()
			tree.position = Vector3(x, y, z)
			var tree_scale = rng.randf_range(0.85, 1.4)
			tree.scale = Vector3(tree_scale, tree_scale, tree_scale)
			tree.rotation.y = rng.randf() * TAU
			trees_node.add_child(tree)
			
	# Para el follaje denso infinito como en Foto 1: MultiMesh de 1000 pinos adicionales
	generate_dense_multimesh_forest(rng)

func generate_dense_multimesh_forest(rng: RandomNumberGenerator):
	var multimesh_inst = MultiMeshInstance3D.new()
	var multimesh = MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.instance_count = 800
	
	# Mesh del pino cónico
	var cone = CylinderMesh.new()
	cone.top_radius = 0.05
	cone.bottom_radius = 3.5
	cone.height = 14.0
	var pine_mat = StandardMaterial3D.new()
	pine_mat.albedo_color = Color(0.12, 0.26, 0.10, 1.0)
	pine_mat.roughness = 0.85
	cone.material = pine_mat
	multimesh.mesh = cone
	
	var valid_idx = 0
	for i in range(800):
		var x = rng.randf_range(-1400.0, 1400.0)
		var z = rng.randf_range(-1400.0, 1400.0)
		var y = get_height(x, z)
		if y < 130.0:
			var t = Transform3D()
			var s = rng.randf_range(0.9, 1.6)
			t = t.scaled(Vector3(s, s, s))
			t.origin = Vector3(x, y + 7.0 * s, z)
			multimesh.set_instance_transform(valid_idx, t)
			valid_idx += 1
			
	multimesh.instance_count = valid_idx
	multimesh_inst.multimesh = multimesh
	add_child(multimesh_inst)

func spawn_medieval_towers():
	var tower_scene = preload("res://scenes/tower.tscn")
	var positions = [
		Vector2(120, -80), Vector2(-150, 140), Vector2(250, 180),
		Vector2(-280, -220), Vector2(400, -100), Vector2(-420, 260),
		Vector2(180, 500), Vector2(-550, -400), Vector2(700, -300),
		Vector2(-100, 750), Vector2(500, 800), Vector2(-800, 100)
	]
	
	for pos2 in positions:
		var tower = tower_scene.instantiate()
		var y = get_height(pos2.x, pos2.y)
		tower.position = Vector3(pos2.x, y, pos2.y)
		towers_node.add_child(tower)

func spawn_knights():
	var knight_scene = preload("res://scenes/knight.tscn")
	var rng = RandomNumberGenerator.new()
	rng.seed = 54321
	
	for tower in towers_node.get_children():
		for k in range(3):
			var knight = knight_scene.instantiate()
			var offset_x = rng.randf_range(-15.0, 15.0)
			var offset_z = rng.randf_range(-15.0, 15.0)
			var kx = tower.position.x + offset_x
			var kz = tower.position.z + offset_z
			var ky = get_height(kx, kz)
			knight.position = Vector3(kx, ky, kz)
			add_child(knight)

func spawn_rey_supremo():
	var boss_scene = preload("res://scenes/boss_dragon.tscn")
	var boss = boss_scene.instantiate()
	# Situado sobre la cumbre nevada más alta
	boss.summit_pos = Vector3(600.0, 310.0, 600.0)
	add_child(boss)

func trigger_elemental_cataclysm(epicenter: Vector3, element: String):
	print("Cataclismo desatado: ", element, " en ", epicenter)
	if element == "fire":
		for i in range(20):
			var offset = Vector3(randf_range(-80, 80), randf_range(20, 60), randf_range(-80, 80))
			ignite_area(epicenter + offset, 35.0)
	elif element == "ice" or element == "water":
		extinguish_area(epicenter, 60.0)

func ignite_area(pos: Vector3, radius: float):
	for tree in trees_node.get_children():
		if tree.global_position.distance_to(pos) <= radius:
			if tree.has_method("burn"):
				tree.burn()

func extinguish_area(pos: Vector3, radius: float):
	for tree in trees_node.get_children():
		if tree.global_position.distance_to(pos) <= radius:
			if tree.has_method("extinguish"):
				tree.extinguish()
