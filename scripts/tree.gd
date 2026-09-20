extends StaticBody3D

var is_burning: bool = false
var burn_time: float = 0.0
var max_burn_time: float = 4.0

@onready var fire_particles = $FireParticles

func burn():
	if is_burning: return
	is_burning = true
	if fire_particles:
		fire_particles.emitting = true

func extinguish():
	if not is_burning: return
	is_burning = false
	if fire_particles:
		fire_particles.emitting = false

func _process(delta: float):
	if is_burning:
		burn_time += delta
		var char_factor = max(0.0, 1.0 - (burn_time / max_burn_time))
		for tier_name in ["Tier1", "Tier2", "Tier3", "Tier4"]:
			if has_node(tier_name):
				get_node(tier_name).scale = Vector3(char_factor, char_factor, char_factor)
		if burn_time >= max_burn_time:
			is_burning = false
			if fire_particles:
				fire_particles.emitting = false
