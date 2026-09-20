extends CharacterBody3D

var health: float = 40.0
var patrol_center: Vector3
var patrol_angle: float = 0.0
var patrol_radius: float = 12.0
var is_fleeing: bool = false
var speed: float = 2.5

@onready var visual = $Visual

func _ready():
	patrol_center = global_position
	patrol_angle = randf() * TAU

func _physics_process(delta: float):
	# Detectar si un dragón está cerca
	var dragons = get_tree().get_nodes_in_group("player_dragons")
	var closest_dragon = null
	var min_dist = 9999.0
	for d in dragons:
		var dist = global_position.distance_to(d.global_position)
		if dist < min_dist:
			min_dist = dist
			closest_dragon = d
			
	if min_dist < 45.0 and closest_dragon:
		# Huir aterrorizado del dragón
		is_fleeing = true
		var away_dir = (global_position - closest_dragon.global_position)
		away_dir.y = 0.0
		away_dir = away_dir.normalized()
		velocity = away_dir * 5.0
		look_at(global_position + away_dir, Vector3.UP)
	else:
		is_fleeing = false
		# Patrullar en círculo
		patrol_angle += delta * 0.4
		var target = patrol_center + Vector3(cos(patrol_angle) * patrol_radius, 0.0, sin(patrol_angle) * patrol_radius)
		var dir = (target - global_position)
		dir.y = 0.0
		if dir.length() > 0.5:
			velocity = dir.normalized() * speed
			look_at(global_position + dir.normalized(), Vector3.UP)
		else:
			velocity = Vector3.ZERO
			
	move_and_slide()

func take_damage(dmg: float):
	health -= dmg
	if health <= 0.0:
		queue_free()
