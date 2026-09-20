extends Node

# Por defecto 1 Jugador en pantalla completa
var is_split_screen: bool = false

@onready var container_p1 = $SplitScreen/ViewportContainerP1
@onready var container_p2 = $SplitScreen/ViewportContainerP2
@onready var viewport_p1 = $SplitScreen/ViewportContainerP1/ViewportP1
@onready var viewport_p2 = $SplitScreen/ViewportContainerP2/ViewportP2
@onready var camera_p1 = $SplitScreen/ViewportContainerP1/ViewportP1/CameraP1
@onready var camera_p2 = $SplitScreen/ViewportContainerP2/ViewportP2/CameraP2

var dragon_p1: CharacterBody3D
var dragon_p2: CharacterBody3D

func _ready():
	viewport_p2.world_3d = viewport_p1.world_3d
	
	var world_node = viewport_p1.get_node("World")
	var dragon_scene = preload("res://scenes/dragon.tscn")
	
	dragon_p1 = dragon_scene.instantiate()
	dragon_p1.player_id = 1
	dragon_p1.dragon_type = "ignisferus"
	dragon_p1.position = Vector3(0, 45, 0)
	world_node.add_child(dragon_p1)
	
	dragon_p2 = dragon_scene.instantiate()
	dragon_p2.player_id = 2
	dragon_p2.dragon_type = "zephyron"
	dragon_p2.position = Vector3(22, 45, 15)
	world_node.add_child(dragon_p2)

	$SplitScreen/ViewportContainerP1/ViewportP1/PlayerHUD.player_dragon = dragon_p1
	$SplitScreen/ViewportContainerP2/ViewportP2/PlayerHUD.player_dragon = dragon_p2

	set_multiplayer_mode(false)

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
	var speed_ratio = clamp((speed - 20.0) / 70.0, 0.0, 1.0)
	
	# Distancia cercana y cinematográfica para ver los detalles del dragón
	var base_dist = (5.5 + speed_ratio * 2.5) * dragon.scale.x
	var height_offset = (2.6 + speed_ratio * 0.8) * dragon.scale.x
	
	var target_pos = dragon.global_position + (dragon.transform.basis.z * base_dist) + Vector3(0, height_offset, 0)
	cam.global_position = cam.global_position.lerp(target_pos, delta * 8.5)
	
	cam.fov = lerp(cam.fov, 65.0 + speed_ratio * 15.0, delta * 5.0)
	
	# Punto de mira por encima de la cabeza hacia el horizonte
	var look_target = dragon.global_position + (-dragon.transform.basis.z * 6.0 * dragon.scale.x) + Vector3(0, 1.0 * dragon.scale.x, 0)
	cam.look_at(look_target, Vector3.UP)

func _input(event):
	# Tecla M o botón Select para alternar multijugador
	if event.is_action_pressed("toggle_split_screen"):
		set_multiplayer_mode(not is_split_screen)
