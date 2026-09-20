extends Area3D

var velocity: Vector3 = Vector3.ZERO
var element: String = "fire"
var life_time: float = 5.0
var scale_factor: float = 1.0

func launch(direction: Vector3, elem: String, scale_val: float):
	element = elem
	scale_factor = scale_val
	scale = Vector3(scale_val, scale_val, scale_val)
	velocity = direction.normalized() * (95.0 * max(0.8, scale_val))
	
	var mesh = $MeshInstance3D
	var mat = StandardMaterial3D.new()
	if element == "fire":
		mat.albedo_color = Color(1.0, 0.3, 0.0)
		mat.emission_enabled = true
		mat.emission = Color(1.0, 0.4, 0.0)
		mat.emission_energy_multiplier = 4.0
	elif element == "ice":
		mat.albedo_color = Color(0.1, 0.85, 1.0)
		mat.emission_enabled = true
		mat.emission = Color(0.2, 0.9, 1.0)
		mat.emission_energy_multiplier = 3.5
	elif element == "water":
		mat.albedo_color = Color(0.08, 0.45, 1.0)
		mat.emission_enabled = true
		mat.emission = Color(0.1, 0.55, 1.0)
		mat.emission_energy_multiplier = 3.0
	elif element == "plants":
		mat.albedo_color = Color(0.15, 0.95, 0.2)
		mat.emission_enabled = true
		mat.emission = Color(0.25, 1.0, 0.25)
		mat.emission_energy_multiplier = 3.5
	elif element == "air":
		mat.albedo_color = Color(0.92, 0.96, 1.0)
		mat.emission_enabled = true
		mat.emission = Color(0.85, 0.92, 1.0)
		mat.emission_energy_multiplier = 4.0
		
	mesh.set_surface_override_material(0, mat)

func _physics_process(delta: float):
	global_position += velocity * delta
	life_time -= delta
	if life_time <= 0:
		queue_free()

func _on_body_entered(body):
	if body.is_in_group("player_dragons"):
		return
		
	var damage = 65.0 * scale_factor
	if body.has_method("take_damage"):
		body.take_damage(damage)
	elif body.has_method("burn") and element == "fire":
		body.burn()
	elif body.has_method("extinguish") and (element == "ice" or element == "water"):
		body.extinguish()
		
	# Otorgar puntos a los jugadores para evolución
	var dragons = get_tree().get_nodes_in_group("player_dragons")
	for d in dragons:
		if d.has_method("add_points"):
			d.add_points(150)
			
	queue_free()
