shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec4 albedo_color : source_color = vec4(0.55, 0.08, 0.04, 1.0);
uniform vec4 belly_color : source_color = vec4(0.85, 0.35, 0.12, 1.0);
uniform float roughness_val : hint_range(0.0, 1.0) = 0.35;
uniform float metallic_val : hint_range(0.0, 1.0) = 0.45;
uniform float rim_intensity : hint_range(0.0, 3.0) = 1.2;
uniform vec4 rim_color : source_color = vec4(1.0, 0.4, 0.1, 1.0);

// Patrón de escamas celulares (Voronoi 3D)
vec2 voronoi2d(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float md = 8.0;
    vec2 mr;
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = fract(sin(vec2(dot(n + g, vec2(127.1, 311.7)), dot(n + g, vec2(269.5, 183.3)))) * 43758.5453);
            vec2 r = g + o - f;
            float d = dot(r, r);
            if (d < md) {
                md = d;
                mr = r;
            }
        }
    }
    return vec2(sqrt(md), mr.x);
}

void fragment() {
    // Escamas en espacio de modelo
    vec2 uv_scaled = UV * 45.0;
    vec2 scale_data = voronoi2d(uv_scaled);
    float cell_dist = scale_data.x;
    
    // Normal perturbada para relieve de escamas 3D
    float edge = smoothstep(0.0, 0.35, cell_dist);
    vec3 scale_normal = vec3(scale_data.y * 0.4, (1.0 - edge) * 0.5, 1.0);
    NORMAL = normalize(NORMAL + scale_normal * 0.3);

    // Variación de color entre crestas de escamas y ranuras
    vec3 col = mix(albedo_color.rgb * 0.7, albedo_color.rgb * 1.3, edge);
    
    // Gradiente ventral
    col = mix(belly_color.rgb, col, clamp(NORMAL.y * 0.5 + 0.5, 0.0, 1.0));

    ALBEDO = col;
    ROUGHNESS = mix(roughness_val, 0.7, 1.0 - edge);
    METALLIC = metallic_val * edge;

    // Rim lighting (Efecto de luz rasante en el contorno del dragón)
    float fresnel = pow(1.0 - max(0.0, dot(NORMAL, VIEW)), 3.0);
    EMISSION = rim_color.rgb * fresnel * rim_intensity * 0.5;
}
