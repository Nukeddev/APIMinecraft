## 🎮 Página — Minecraft Explorer

Explorador completo del universo Minecraft que consume la API de **BlocksItems** para mostrar items, bloques y recetas del juego.

### 🔗 API utilizada

```
Base URL: https://blocksitems.com/api/v1
```

| Endpoint | Descripción |
|---|---|
| `GET /items` | Lista todos los items |
| `GET /blocks` | Lista todos los bloques |
| `GET /recipes` | Lista todas las recetas |
| `GET /items/{full_id}/icon` | Icono de un item |
| `GET /blocks/{full_id}/icon` | Icono de un bloque |

### ⚙️ Parámetros de consulta

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | integer | Número de página (default: 1) |
| `limit` | integer | Resultados por página (default: 50) |
| `search` | string | Búsqueda por nombre o full_id |
| `namespace` | string | Filtrar por namespace (ej: `minecraft`) |
| `mod_id` | string | Filtrar por mod (ej: `create`) |
| `rarity` | string | Filtrar por rareza: `common`, `uncommon`, `rare`, `epic` |
| `tag` | string | Filtrar por tag (ej: `minecraft:tools`) |
| `is_waterloggable` | string | Solo bloques: `true` o `false` |
| `hardness_min/max` | float | Solo bloques: rango de dureza |
| `light_min/max` | integer | Solo bloques: rango de luz emitida (0-15) |

### 📦 Estructura del JSON (Item)

```json
{
  "id": "uuid",
  "full_id": "minecraft:diamond",
  "display_name": "Diamond",
  "namespace": "minecraft",
  "mod_id": "minecraft",
  "rarity": "common",
  "max_stack_size": 64,
  "max_damage": 0,
  "is_damageable": false,
  "enchantment_value": 10,
  "is_fireproof": false,
  "dominant_color": "#A4362A",
  "translation_key": "item.minecraft.diamond",
  "created_at": "2026-02-17T23:30:17.087884Z"
}
```

### ✨ Funcionalidades

- **3 tabs**: Items, Bloques y Recetas
- **Búsqueda en tiempo real** con debounce de 400ms
- **Filtros avanzados** por namespace, mod, rareza, tag, dureza y luz
- **Paginación** controlada por la API (48 por página)
- **Iconos** cargados desde `/icon` de cada item/bloque
- **Color dominante** como fallback si la imagen no carga
- **Modal de detalle** con todas las propiedades al hacer clic
- **Vista cuadrícula / lista**
- **Badges de rareza**: common, uncommon, rare, epic
- **Estadísticas** en tiempo real (total, mostrando, páginas)

<img width="1911" height="920" alt="image" src="https://github.com/user-attachments/assets/a6f53169-dee1-4788-b49f-400fed4abaf5" />
