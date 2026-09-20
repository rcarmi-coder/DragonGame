extends Control

signal game_started(initial_element: String, multiplayer_enabled: bool)

var current_elem: String = "fire"
var multiplayer_enabled: bool = false

@onready var elem_btn_fire = $Panel/VBoxContainer/ElementSelection/BtnFire
@onready var elem_btn_ice = $Panel/VBoxContainer/ElementSelection/BtnIce
@onready var elem_btn_water = $Panel/VBoxContainer/ElementSelection/BtnWater
@onready var elem_btn_plants = $Panel/VBoxContainer/ElementSelection/BtnPlants
@onready var elem_btn_air = $Panel/VBoxContainer/ElementSelection/BtnAir
@onready var multiplayer_btn = $Panel/VBoxContainer/BtnMultiplayer

func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS
	update_element_ui()

func update_element_ui():
	var btns = {
		"fire": elem_btn_fire,
		"ice": elem_btn_ice,
		"water": elem_btn_water,
		"plants": elem_btn_plants,
		"air": elem_btn_air
	}
	for k in btns.keys():
		var btn = btns[k]
		if btn:
			btn.modulate = Color(1.4, 1.4, 1.4) if k == current_elem else Color(0.65, 0.65, 0.65)

func _on_btn_fire_pressed():
	current_elem = "fire"
	update_element_ui()

func _on_btn_ice_pressed():
	current_elem = "ice"
	update_element_ui()

func _on_btn_water_pressed():
	current_elem = "water"
	update_element_ui()

func _on_btn_plants_pressed():
	current_elem = "plants"
	update_element_ui()

func _on_btn_air_pressed():
	current_elem = "air"
	update_element_ui()

func _on_btn_multiplayer_pressed():
	multiplayer_enabled = not multiplayer_enabled
	if multiplayer_btn:
		multiplayer_btn.text = "MODO MULTIJUGADOR: " + ("ACTIVADO (2P)" if multiplayer_enabled else "DESACTIVADO (1P)")

func _on_btn_start_pressed():
	emit_signal("game_started", current_elem, multiplayer_enabled)
	visible = false

func _input(event):
	if visible:
		if event.is_action_pressed("ui_accept") or event.is_action_pressed("p1_flap"):
			_on_btn_start_pressed()
