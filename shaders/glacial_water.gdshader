shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back, specular_schlick_ggx;

uniform vec4 water_color : source_color = vec4(0.04, 0.22, 0.32, 0.92);
uniform vec4 foam_color : source_color = vec4(0.85, 0.95, 1.0, 0.7);
uniform float wave_speed = 0.8;

void fragment() {
    vec2 uv = UV * 15.0;
    float t = TIME * wave_speed;
    float wave = sin(uv.x * 2.0 + t) * cos(uv.y * 2.0 + t * 0.8) * 0.5 + 0.5;
    
    ALBEDO = mix(water_color.rgb, foam_color.rgb, wave * 0.15);
    ALPHA = water_color.a;
    ROUGHNESS = 0.08;
    SPECULAR = 0.95;
    METALLIC = 0.1;
}
