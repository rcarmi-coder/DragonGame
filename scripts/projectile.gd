extends Area3D

var velocity: Vector3 = Vector3.ZERO
var element: String = "fire"
var life_time: float = 4.0
var scale_factor: float = 1.0

func launch(direction: Vector3, elem: String, scale_val: float):
	element = elem
	scale_factor = scale_val
	scale = Vector3(scale_val, scale_val, scale_val)
	velocity = direction.normalized() * (85.0 * scale_val)
	
	var mesh = $MeshInstance3D
	var mat = StandardMaterial3D.new()
	if element == "fire":
		mat.albedo_color = Color(1.0, 0.3, 0.0)
		mat.emission_enabled = true
		mat.emission = Color(1.0, 0.4, 0.0)
		mat.emission_energy_multiplier = 3.0
	elif element == "ice":
		mat.albedo_color = Color(0.1, 0.8, 1.0)
		mat.emission_enabled = true
		mat.emission = Color(0.2, 0.9, 1.0)
		mat.emission_energy_multiplier = 2.5
	elif element == "water":
		mat.albedo_color = Color(0.1, 0.4, 1.0)
		mat.emission_enabled = true
		mat.emission = Color(0.1, 0.5, 1.0)
		mat.emission_energy_multiplier = 2.0
	elif element == "plants":
		mat.albedo_color = Color(0.2, 1.0, 0.1)
		mat.emission_enabled = true
		mat.emission = Color(0.3, 1.0, 0.2)
		mat.emission_energy_multiplier = 2.5
		
	mesh.set_surface_override_material(0, mat)

func _physics_process(delta: float):
	global_position += velocity * delta
	life_time -= delta
	if life_time <= 0:
		queue_free()

func _on_body_entered(body):
	# Si impacta terreno o enemigo
	queue_free()
