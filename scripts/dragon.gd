extends CharacterBody3D
class_name DragonPlayer

@export var player_id: int = 1
@export var dragon_type: String = "ignisferus"

# Cinemática de vuelo
var current_speed: float = 35.0
var min_speed: float = 12.0
var cruise_speed: float = 38.0
var max_speed: float = 90.0

var pitch_angle: float = 0.0
var yaw_angle: float = 0.0
var roll_angle: float = 0.0
var target_roll: float = 0.0

# Estamina y Salud
var health: float = 100.0
var max_health: float = 100.0
var stamina: float = 100.0
var max_stamina: float = 100.0

# Evolución
var stage: int = 1
var points: int = 0
var target_scale: float = 1.0

# Elemento actual
var current_element: String = "fire"
var ultimate_charge: float = 100.0

# Piruetas
var is_barrel_rolling: bool = false
var barrel_roll_timer: float = 0.0
var barrel_roll_dir: float = 1.0

# Nodos
@onready var model_root = $SculptedModel
@onready var mouth_marker = $MouthMarker
@onready var evolution_light = $EvolutionLight

var anim_player: AnimationPlayer = null

func _ready():
	anim_player = find_anim_player(self)
	if anim_player:
		# Iniciar animación de vuelo majestuoso
		var anims = anim_player.get_animation_list()
		if anims.size() > 0:
			var flight_anim = anims[0]
			var anim_res = anim_player.get_animation(flight_anim)
			anim_res.loop_mode = Animation.LOOP_LINEAR
			anim_player.play(flight_anim)

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for c in node.get_children():
		var f = find_anim_player(c)
		if f: return f
	return null

func _physics_process(delta: float):
	process_flight_inputs(delta)
	process_attacks(delta)
	update_animation_speed()
	update_evolution_scale(delta)

func get_prefix() -> String:
	return "p1_" if player_id == 1 else "p2_"

func process_flight_inputs(delta: float):
	var p = get_prefix()
	
	# Tonel evasivo (Barrel Roll)
	if not is_barrel_rolling:
		if Input.is_action_just_pressed(p + "roll_left"):
			start_barrel_roll(-1.0)
		elif Input.is_action_just_pressed(p + "roll_right"):
			start_barrel_roll(1.0)
			
	if is_barrel_rolling:
		barrel_roll_timer += delta * 4.0
		roll_angle = barrel_roll_dir * barrel_roll_timer * TAU
		if barrel_roll_timer >= 1.0:
			is_barrel_rolling = false
			roll_angle = 0.0
	else:
		# Alabeo suave al virar (Banking)
		var turn_input = Input.get_axis(p + "left", p + "right")
		target_roll = -turn_input * 0.95
		roll_angle = lerp(roll_angle, target_roll, delta * 5.5)

	# Ejes analógicos
	var pitch_input = Input.get_axis(p + "up", p + "down")
	var yaw_input = Input.get_axis(p + "left", p + "right")

	yaw_angle -= yaw_input * 2.4 * delta
	pitch_angle = lerp(pitch_angle, -pitch_input * 0.95, delta * 4.5)

	# Aleteo e impulso
	var target_speed = cruise_speed
	var is_flapping = Input.is_action_pressed(p + "flap")

	if is_flapping and stamina > 5.0:
		stamina = max(0.0, stamina - delta * 20.0)
		velocity.y += delta * 26.0
		target_speed += 12.0
	else:
		stamina = min(max_stamina, stamina + delta * 15.0)

	# Aceleración R2
	if Input.is_action_pressed(p + "accelerate"):
		target_speed = max_speed
		stamina = max(0.0, stamina - delta * 14.0)
	elif Input.is_action_pressed(p + "brake"):
		target_speed = min_speed

	current_speed = lerp(current_speed, target_speed, delta * 3.5)

	# Aplicar rotación al cuerpo del dragón
	rotation.y = yaw_angle
	rotation.x = pitch_angle
	rotation.z = roll_angle

	# Vector hacia adelante
	var forward_dir = -transform.basis.z
	velocity = forward_dir * current_speed

	move_and_slide()

func start_barrel_roll(dir: float):
	is_barrel_rolling = true
	barrel_roll_timer = 0.0
	barrel_roll_dir = dir
	trigger_vibration(0.4, 0.8, 0.35)

func update_animation_speed():
	if not anim_player: return
	var p = get_prefix()
	var is_flapping = Input.is_action_pressed(p + "flap")
	var is_boosting = Input.is_action_pressed(p + "accelerate")
	
	if is_flapping or is_boosting:
		anim_player.speed_scale = 1.8
	else:
		anim_player.speed_scale = 1.0

func process_attacks(_delta: float):
	var p = get_prefix()

	if Input.is_action_just_pressed(p + "elem_fire"): current_element = "fire"
	elif Input.is_action_just_pressed(p + "elem_ice"): current_element = "ice"
	elif Input.is_action_just_pressed(p + "elem_water"): current_element = "water"
	elif Input.is_action_just_pressed(p + "elem_plants"): current_element = "plants"

	if Input.is_action_just_pressed(p + "projectile"):
		fire_projectile()

	if Input.is_action_just_pressed(p + "ultimate"):
		if stage >= 2 and ultimate_charge >= 100.0:
			trigger_ultimate()

func fire_projectile():
	trigger_vibration(0.6, 0.9, 0.3)
	var proj_scene = preload("res://scenes/projectile.tscn")
	var proj = proj_scene.instantiate()
	get_parent().add_child(proj)
	proj.global_position = mouth_marker.global_position
	proj.launch(-transform.basis.z, current_element, scale.x)

func trigger_ultimate():
	ultimate_charge = 0.0
	trigger_vibration(1.0, 1.0, 1.6)
	var world = get_tree().get_first_node_in_group("world")
	if world and world.has_method("trigger_elemental_cataclysm"):
		world.trigger_elemental_cataclysm(global_position, current_element)

func update_evolution_scale(delta: float):
	if abs(scale.x - target_scale) > 0.01:
		var s = lerp(scale.x, target_scale, delta * 2.5)
		scale = Vector3(s, s, s)

func add_points(pts: int):
	points += pts
	if stage == 1 and points >= 500:
		evolve(2)
	elif stage == 2 and points >= 1500:
		evolve(3)

func evolve(new_stage: int):
	stage = new_stage
	target_scale = 1.6 if stage == 2 else 2.5
	trigger_vibration(1.0, 1.0, 1.5)
	if evolution_light:
		evolution_light.light_energy = 25.0
		var tween = create_tween()
		tween.tween_property(evolution_light, "light_energy", 0.0, 2.5)

func trigger_vibration(weak: float, strong: float, duration: float):
	var joy_idx = player_id - 1
	Input.start_joy_vibration(joy_idx, weak, strong, duration)
