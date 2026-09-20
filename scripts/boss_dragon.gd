extends CharacterBody3D

@export var max_health: float = 2000.0
var health: float = 2000.0

var element_cycle = ["fire", "ice", "water", "plants"]
var current_elem_idx: int = 0
var attack_timer: float = 0.0
var orbit_angle: float = 0.0
var summit_pos: Vector3 = Vector3(600.0, 310.0, 600.0)
var orbit_radius: float = 90.0

@onready var model_root = $SculptedModel
var anim_player: AnimationPlayer

func _ready():
	add_to_group("bosses")
	position = summit_pos
	scale = Vector3(3.2, 3.2, 3.2)
	
	# Configurar animación de vuelo majestuoso
	anim_player = find_anim_player(self)
	if anim_player:
		var anims = anim_player.get_animation_list()
		if anims.size() > 0:
			var flight_anim = anims[0]
			var anim_res = anim_player.get_animation(flight_anim)
			anim_res.loop_mode = Animation.LOOP_LINEAR
			anim_player.play(flight_anim)
			anim_player.speed_scale = 0.85

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for c in node.get_children():
		var f = find_anim_player(c)
		if f: return f
	return null

func _physics_process(delta: float):
	# Patrullar la cumbre más alta en un círculo majestuoso
	orbit_angle += delta * 0.25
	var target_x = summit_pos.x + cos(orbit_angle) * orbit_radius
	var target_z = summit_pos.z + sin(orbit_angle) * orbit_radius
	var target_y = summit_pos.y + sin(orbit_angle * 2.0) * 15.0
	
	var target_pos = Vector3(target_x, target_y, target_z)
	var forward = (target_pos - global_position).normalized()
	velocity = forward * 28.0
	
	if forward.length_squared() > 0.01:
		look_at(global_position - forward, Vector3.UP)
		
	move_and_slide()
	
	# Ataques elementales periódicos si hay jugadores cerca
	attack_timer += delta
	if attack_timer >= 4.5:
		attack_timer = 0.0
		execute_boss_attack()

func execute_boss_attack():
	var dragons = get_tree().get_nodes_in_group("player_dragons")
	for d in dragons:
		if global_position.distance_to(d.global_position) < 220.0:
			var elem = element_cycle[current_elem_idx]
			current_elem_idx = (current_elem_idx + 1) % element_cycle.size()
			
			var proj_scene = preload("res://scenes/projectile.tscn")
			var proj = proj_scene.instantiate()
			get_parent().add_child(proj)
			proj.global_position = global_position + Vector3(0, 4, 0)
			var dir = (d.global_position - global_position).normalized()
			proj.launch(dir, elem, 2.5)

func take_damage(amount: float):
	health -= amount
	print("Rey Supremo herido: ", health, "/", max_health)
	if health <= 0.0:
		defeat()

func defeat():
	queue_free()
