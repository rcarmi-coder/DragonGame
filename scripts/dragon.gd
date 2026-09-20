extends CharacterBody3D
class_name DragonPlayer

@export var player_id: int = 1
@export var dragon_type: String = "ignisferus"

enum FlightState { FLYING, BRAKING, LANDED }
var state: FlightState = FlightState.FLYING

# Cinemática de vuelo y tierra
var current_speed: float = 35.0
var min_speed: float = 0.0
var cruise_speed: float = 38.0
var max_speed: float = 90.0

var pitch_angle: float = 0.0
var yaw_angle: float = 0.0
var roll_angle: float = 0.0
var target_roll: float = 0.0

# Animación procedural de patas y alas
var leg_tuck_factor: float = 1.0 # 1.0 = completamente guardadas en vuelo, 0.0 = posadas en tierra
var wing_curve_factor: float = 0.0 # 0.0 = alas extendidas, 1.0 = alas curvadas al frenar
var head_look_timer: float = 0.0

# Vidas, Estamina y Salud
var lives: int = 3
var max_lives: int = 3
var health: float = 100.0
var max_health: float = 100.0
var stamina: float = 100.0
var max_stamina: float = 100.0

# Evolución (Bebé -> Joven -> Titán)
var stage: int = 1
var points: int = 0
var target_scale: float = 0.35 # Comienza como Bebé Dragón

# 5 Elementos
var current_element: String = "fire"
var ultimate_charge: float = 100.0

# Tonel evasivo (Barrel Roll)
var is_barrel_rolling: bool = false
var barrel_roll_timer: float = 0.0
var barrel_roll_dir: float = 1.0

# Nodos
@onready var model_root = $SculptedModel
@onready var mouth_marker = $MouthMarker
@onready var evolution_light = $EvolutionLight

var anim_player: AnimationPlayer = null
var skeleton: Skeleton3D = null

# Índices de huesos para patas y alas
const FRONT_LEG_BONES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
const HIND_LEG_BONES = [48, 49, 50, 51, 52, 53, 54, 55, 56]
const WING_JOINT_BONES = [19, 20, 25, 26]
const HEAD_BONE = 36

# Colores elementales
const ELEMENT_COLORS = {
	"fire": Color(1.0, 0.35, 0.12, 1.0),
	"ice": Color(0.25, 0.85, 1.0, 1.0),
	"water": Color(0.10, 0.45, 0.95, 1.0),
	"plants": Color(0.18, 0.90, 0.25, 1.0),
	"air": Color(0.92, 0.96, 1.0, 1.0)
}

func _ready():
	add_to_group("player_dragons")
	scale = Vector3(target_scale, target_scale, target_scale)
	
	anim_player = find_anim_player(self)
	skeleton = find_skeleton(self)
	
	if anim_player:
		var anims = anim_player.get_animation_list()
		if anims.size() > 0:
			var flight_anim = anims[0]
			var anim_res = anim_player.get_animation(flight_anim)
			anim_res.loop_mode = Animation.LOOP_LINEAR
			anim_player.play(flight_anim)
			
	update_elemental_appearance()

func find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for c in node.get_children():
		var f = find_anim_player(c)
		if f: return f
	return null

func find_skeleton(node: Node) -> Skeleton3D:
	if node is Skeleton3D: return node
	for c in node.get_children():
		var f = find_skeleton(c)
		if f: return f
	return null

func get_prefix() -> String:
	return "p1_" if player_id == 1 else "p2_"

func _physics_process(delta: float):
	check_ground_landing_and_flight(delta)
	process_attacks(delta)
	update_evolution_scale(delta)
	update_procedural_bones(delta)

func check_ground_landing_and_flight(delta: float):
	var p = get_prefix()
	var world = get_tree().get_first_node_in_group("world")
	var ground_y = 0.0
	if world and world.has_method("get_height"):
		ground_y = world.get_height(global_position.x, global_position.z)
		
	var altitude = global_position.y - ground_y
	var landing_dist = 2.4 * scale.x
	
	var is_pressing_flap = Input.is_action_just_pressed(p + "flap") or Input.is_action_pressed(p + "flap")
	var is_pressing_accel = Input.is_action_pressed(p + "accelerate")
	
	# Transición a aterrizaje si estamos tocando el suelo y frenando
	if altitude <= landing_dist:
		if state != FlightState.LANDED and not is_pressing_flap and current_speed < 18.0:
			# ATERRIZA EN TIERRA
			state = FlightState.LANDED
			global_position.y = ground_y + 1.1 * scale.x
			current_speed = 0.0
			pitch_angle = lerp(pitch_angle, 0.0, delta * 8.0)
			roll_angle = lerp(roll_angle, 0.0, delta * 8.0)
			trigger_vibration(0.3, 0.5, 0.2)
	
	if state == FlightState.LANDED:
		process_ground_state(delta, is_pressing_flap, is_pressing_accel)
	else:
		process_flight_inputs(delta, ground_y)

func process_ground_state(delta: float, is_pressing_flap: bool, is_pressing_accel: bool):
	var p = get_prefix()
	leg_tuck_factor = lerp(leg_tuck_factor, 0.0, delta * 6.0) # Desplegar patas completamente
	wing_curve_factor = lerp(wing_curve_factor, 0.9, delta * 5.0) # Plegar alas en tierra
	
	# Curiosidad del dragón en tierra: mira hacia los lados
	head_look_timer += delta
	stamina = min(max_stamina, stamina + delta * 35.0) # Recupera estamina rápido en tierra
	
	# Girar sobre su propio eje en tierra con controles de giro
	var turn_input = Input.get_axis(p + "left", p + "right")
	yaw_angle -= turn_input * 2.0 * delta
	rotation.y = yaw_angle
	rotation.x = 0.0
	rotation.z = 0.0
	
	# Caminar suavemente en tierra
	var forward_input = Input.get_axis(p + "down", p + "up")
	if abs(forward_input) > 0.1:
		var walk_speed = 8.0 * scale.x
		velocity = -transform.basis.z * forward_input * walk_speed
		move_and_slide()
	else:
		velocity = Vector3.ZERO
		
	# Despegar hacia el cielo con botón de aleteo (Espacio / R1) o acelerar
	if is_pressing_flap or is_pressing_accel:
		state = FlightState.FLYING
		velocity.y = 26.0 * scale.x
		current_speed = cruise_speed * 0.7
		trigger_vibration(0.6, 0.8, 0.35)

func process_flight_inputs(delta: float, ground_y: float):
	var p = get_prefix()
	leg_tuck_factor = lerp(leg_tuck_factor, 1.0, delta * 5.0) # Guardar patas atrás en vuelo
	
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
		var turn_input = Input.get_axis(p + "left", p + "right")
		target_roll = -turn_input * 0.95
		roll_angle = lerp(roll_angle, target_roll, delta * 5.5)

	var pitch_input = Input.get_axis(p + "up", p + "down")
	var yaw_input = Input.get_axis(p + "left", p + "right")

	yaw_angle -= yaw_input * 2.4 * delta
	pitch_angle = lerp(pitch_angle, -pitch_input * 0.95, delta * 4.5)

	# Control de velocidad y alas
	var target_speed = cruise_speed
	var is_flapping = Input.is_action_pressed(p + "flap")
	var is_braking = Input.is_action_pressed(p + "brake")
	var is_boosting = Input.is_action_pressed(p + "accelerate")

	if is_braking:
		# Frenar en el aire (puede detenerse y planear/frenar)
		target_speed = 0.0
		wing_curve_factor = lerp(wing_curve_factor, 0.85, delta * 4.5) # Curvar alas mostrando articulaciones
		if anim_player: anim_player.speed_scale = 0.4
	elif is_boosting and stamina > 5.0:
		target_speed = max_speed
		stamina = max(0.0, stamina - delta * 15.0)
		wing_curve_factor = lerp(wing_curve_factor, 0.0, delta * 6.0) # Extensión máxima
		if anim_player: anim_player.speed_scale = 2.0
	elif is_flapping and stamina > 5.0:
		stamina = max(0.0, stamina - delta * 18.0)
		velocity.y += delta * 25.0
		target_speed += 12.0
		wing_curve_factor = lerp(wing_curve_factor, 0.0, delta * 6.0)
		if anim_player: anim_player.speed_scale = 1.8
	else:
		stamina = min(max_stamina, stamina + delta * 16.0)
		wing_curve_factor = lerp(wing_curve_factor, 0.15, delta * 3.5)
		if anim_player: anim_player.speed_scale = 1.0

	current_speed = lerp(current_speed, target_speed, delta * 3.0)

	rotation.y = yaw_angle
	rotation.x = pitch_angle
	rotation.z = roll_angle

	# Movimiento en 3D
	var forward_dir = -transform.basis.z
	velocity = forward_dir * current_speed
	
	# Si la velocidad es muy baja, gravedad suave de descenso
	if current_speed < 10.0:
		velocity.y -= delta * 18.0

	move_and_slide()
	
	# Evitar que traspase el suelo
	if global_position.y < ground_y + 1.2 * scale.x:
		global_position.y = ground_y + 1.2 * scale.x

func update_procedural_bones(delta: float):
	if not skeleton: return
	
	# 1. Guardar patas hacia atrás en vuelo aerodinámico
	# Cuando leg_tuck_factor = 1.0, las patas se contraen y recogen contra el vientre
	var leg_scale = lerp(1.0, 0.22, leg_tuck_factor)
	for b in FRONT_LEG_BONES:
		skeleton.set_bone_pose_scale(b, Vector3(leg_scale, leg_scale, leg_scale))
	for b in HIND_LEG_BONES:
		skeleton.set_bone_pose_scale(b, Vector3(leg_scale, leg_scale, leg_scale))
		
	# 2. Curvar alas hacia adentro mostrando las articulaciones al frenar
	var curve_rot = Quaternion(Vector3(0, 1, 0), wing_curve_factor * 0.45)
	for b in WING_JOINT_BONES:
		var current_rot = skeleton.get_bone_pose_rotation(b)
		skeleton.set_bone_pose_rotation(b, current_rot.slerp(curve_rot, delta * 4.0))
		
	# 3. Mirada curiosa en tierra (oscilación de cabeza)
	if state == FlightState.LANDED:
		var look_yaw = sin(head_look_timer * 1.6) * 0.4
		var look_quat = Quaternion(Vector3.UP, look_yaw)
		skeleton.set_bone_pose_rotation(HEAD_BONE, look_quat)

func start_barrel_roll(dir: float):
	is_barrel_rolling = true
	barrel_roll_timer = 0.0
	barrel_roll_dir = dir
	trigger_vibration(0.4, 0.8, 0.35)

func process_attacks(_delta: float):
	var p = get_prefix()

	if Input.is_action_just_pressed(p + "elem_fire"): set_element("fire")
	elif Input.is_action_just_pressed(p + "elem_ice"): set_element("ice")
	elif Input.is_action_just_pressed(p + "elem_water"): set_element("water")
	elif Input.is_action_just_pressed(p + "elem_plants"): set_element("plants")
	elif Input.is_action_just_pressed(p + "elem_air"): set_element("air")

	if Input.is_action_just_pressed(p + "projectile"):
		fire_projectile()

	if Input.is_action_just_pressed(p + "ultimate"):
		if stage >= 2 and ultimate_charge >= 100.0:
			trigger_ultimate()

func set_element(elem: String):
	current_element = elem
	update_elemental_appearance()
	trigger_vibration(0.2, 0.4, 0.15)

func update_elemental_appearance():
	var col = ELEMENT_COLORS.get(current_element, Color(1, 1, 1))
	if evolution_light:
		evolution_light.light_color = col
		evolution_light.light_energy = 4.0
		var tween = create_tween()
		tween.tween_property(evolution_light, "light_energy", 1.2, 0.8)

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
	if stage == 1 and points >= 400:
		evolve(2)
	elif stage == 2 and points >= 1200:
		evolve(3)

func evolve(new_stage: int):
	stage = new_stage
	if stage == 2:
		target_scale = 1.0 # Dragón Joven
	elif stage == 3:
		target_scale = 2.2 # Rey Titán
		
	trigger_vibration(1.0, 1.0, 1.5)
	if evolution_light:
		evolution_light.light_energy = 30.0
		var tween = create_tween()
		tween.tween_property(evolution_light, "light_energy", 1.5, 2.5)

func take_damage(dmg: float):
	health -= dmg
	trigger_vibration(0.8, 0.9, 0.4)
	if health <= 0.0:
		lose_life()

func lose_life():
	lives -= 1
	health = max_health
	trigger_vibration(1.0, 1.0, 0.8)
	if lives < 0:
		lives = 0
		# Reiniciar en cumbre segura
		global_position = Vector3(0, 120, 0)
		lives = 3

func trigger_vibration(weak: float, strong: float, duration: float):
	var joy_idx = player_id - 1
	Input.start_joy_vibration(joy_idx, weak, strong, duration)
