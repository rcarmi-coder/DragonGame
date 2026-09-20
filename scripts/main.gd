extends Node

# Por defecto 1 Jugador en pantalla completa
var is_split_screen: bool = false

@onready var container_p1 = $SplitScreen/ViewportContainerP1
@onready var container_p2 = $SplitScreen/ViewportContainerP2
@onready var viewport_p1 = $SplitScreen/ViewportContainerP1/ViewportP1
@onready var viewport_p2 = $SplitScreen/ViewportContainerP2/ViewportP2
@onready var camera_p1 = $SplitScreen/ViewportContainerP1/ViewportP1/CameraP1
@onready var camera_p2 = $SplitScreen/ViewportContainerP2/ViewportP2/CameraP2
@onready var title_screen = $TitleScreen

var dragon_p1: CharacterBody3D
var dragon_p2: CharacterBody3D

func _ready():
	viewport_p2.world_3d = viewport_p1.world_3d
	
	var world_node = viewport_p1.get_node("World")
	var dragon_scene = preload("res://scenes/dragon.tscn")
	
	# Calcular altura inicial segura sobre el valle
	var start_y1 = 45.0
	var start_y2 = 45.0
	if world_node.has_method("get_height"):
		start_y1 = world_node.get_height(0.0, 0.0) + 20.0
		start_y2 = world_node.get_height(22.0, 15.0) + 20.0
	
	dragon_p1 = dragon_scene.instantiate()
	dragon_p1.player_id = 1
	dragon_p1.dragon_type = "ignisferus"
	dragon_p1.position = Vector3(0, start_y1, 0)
	world_node.add_child(dragon_p1)
	
	dragon_p2 = dragon_scene.instantiate()
	dragon_p2.player_id = 2
	dragon_p2.dragon_type = "zephyron"
	dragon_p2.position = Vector3(22, start_y2, 15)
	world_node.add_child(dragon_p2)

	$SplitScreen/ViewportContainerP1/ViewportP1/PlayerHUD.player_dragon = dragon_p1
	$SplitScreen/ViewportContainerP2/ViewportP2/PlayerHUD.player_dragon = dragon_p2

	set_multiplayer_mode(false)
	
	if title_screen:
		title_screen.game_started.connect(_on_game_started)

func _on_game_started(initial_element: String, mp_enabled: bool):
	if dragon_p1 and dragon_p1.has_method("set_element"):
		dragon_p1.set_element(initial_element)
	set_multiplayer_mode(mp_enabled)

func set_multiplayer_mode(enabled: bool):
	is_split_screen = enabled
	container_p2.visible = is_split_screen
	dragon_p2.set_physics_process(is_split_screen)

func _physics_process(delta: float):
	update_camera_tracking(camera_p1, dragon_p1, delta)
	if is_split_screen:
		update_camera_tracking(camera_p2, dragon_p2, delta)

func update_camera_tracking(cam: Camera3D, dragon: CharacterBody3D, delta: float):
	if not cam or not dragon: return
	
	var speed = dragon.current_speed if "current_speed" in dragon else 35.0
	var speed_ratio = clamp(speed / 80.0, 0.0, 1.0)
	
	# Distancia cinemática suave escalada con el tamaño del dragón
	var base_dist = (7.0 + speed_ratio * 3.0) * max(0.65, dragon.scale.x * 1.5)
	var height_offset = (3.2 + speed_ratio * 1.2) * max(0.65, dragon.scale.x * 1.5)
	
	var target_pos = dragon.global_position + (dragon.transform.basis.z * base_dist) + Vector3(0, height_offset, 0)
	cam.global_position = cam.global_position.lerp(target_pos, delta * 7.5)
	
	cam.fov = lerp(cam.fov, 62.0 + speed_ratio * 16.0, delta * 5.0)
	
	var look_target = dragon.global_position + (-dragon.transform.basis.z * 5.0 * dragon.scale.x) + Vector3(0, 0.8 * dragon.scale.x, 0)
	cam.look_at(look_target, Vector3.UP)

func _input(event):
	# Tecla M o botón Select para alternar multijugador en tiempo real
	if event.is_action_pressed("toggle_split_screen"):
		set_multiplayer_mode(not is_split_screen)
	# Escape abre/cierra la pantalla de título
	elif event.is_action_pressed("ui_cancel"):
		if title_screen:
			title_screen.visible = not title_screen.visible
