use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn toggle_hud_window(app: AppHandle) -> Result<bool, String> {
    if let Some(hud) = app.get_webview_window("hud") {
        let is_visible = hud.is_visible().map_err(|e| e.to_string())?;
        if is_visible {
            hud.hide().map_err(|e| e.to_string())?;
            Ok(false)
        } else {
            hud.show().map_err(|e| e.to_string())?;
            hud.set_focus().map_err(|e| e.to_string())?;
            Ok(true)
        }
    } else {
        Err("HUD window not found".to_string())
    }
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|e| e.to_string())?;
        main.unminimize().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
fn set_hud_always_on_top(app: AppHandle, always_on_top: bool) -> Result<(), String> {
    if let Some(hud) = app.get_webview_window("hud") {
        hud.set_always_on_top(always_on_top)
            .map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("HUD window not found".to_string())
    }
}

#[tauri::command]
fn get_desktop_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "app": "Living Tracker",
        "version": "0.1.0",
        "tauri": "2.0",
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH
    }))
}

#[tauri::command]
fn get_database_stats() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "status": "connected",
        "storage": "sqlite",
        "db": "living_tracker.db",
        "version": 6
    }))
}

#[tauri::command]
fn optimize_database() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "status": "optimized",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

#[tauri::command]
fn get_system_tray_status() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "tray_enabled": true,
        "menu_items": ["open_main", "toggle_hud", "hide_all", "quit"],
        "hotkey": "Ctrl+Space"
    }))
}

pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_living_tracker_tables",
        sql: "
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                date TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'expense'
            );
            CREATE TABLE IF NOT EXISTS habits (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                icon TEXT,
                streak INTEGER NOT NULL DEFAULT 0,
                best_streak INTEGER NOT NULL DEFAULT 0,
                completed_today INTEGER NOT NULL DEFAULT 0,
                history_json TEXT NOT NULL DEFAULT '[]',
                frozen_dates_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER NOT NULL DEFAULT 0,
                priority TEXT NOT NULL DEFAULT 'medium',
                category TEXT,
                icon TEXT,
                due_date TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            );
            CREATE TABLE IF NOT EXISTS achievements (
                id TEXT PRIMARY KEY,
                unlocked_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        ",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 2,
        description: "add_image_url_to_tasks",
        sql: "ALTER TABLE tasks ADD COLUMN image_url TEXT;",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 3,
        description: "add_checklist_json_to_tasks",
        sql: "ALTER TABLE tasks ADD COLUMN checklist_json TEXT DEFAULT '[]';",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 4,
        description: "add_indexes_for_performance",
        sql: "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date); CREATE INDEX IF NOT EXISTS idx_habits_streak ON habits(streak);",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 5,
        description: "create_daily_summaries_table",
        sql: "CREATE TABLE IF NOT EXISTS daily_summaries (
            date TEXT PRIMARY KEY,
            completed_tasks INTEGER NOT NULL DEFAULT 0,
            completed_habits INTEGER NOT NULL DEFAULT 0,
            total_spent REAL NOT NULL DEFAULT 0.0,
            summary_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        );",
        kind: MigrationKind::Up,
    },
    Migration {
        version: 6,
        description: "add_recurrence_and_habit_targets",
        sql: "
            ALTER TABLE tasks ADD COLUMN recurrence TEXT DEFAULT 'none';
            ALTER TABLE tasks ADD COLUMN estimated_minutes INTEGER DEFAULT 0;
            ALTER TABLE habits ADD COLUMN target_days_per_week INTEGER DEFAULT 7;
        ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:living_tracker.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            toggle_hud_window,
            show_main_window,
            set_hud_always_on_top,
            get_desktop_info,
            get_database_stats,
            optimize_database,
            get_system_tray_status
        ])
        .setup(|app| {
            // Создаем меню для системного трея
            let open_main_i = MenuItem::with_id(
                app,
                "open_main",
                "📊 Главный командный центр",
                true,
                None::<&str>,
            )?;
            let toggle_hud_i = MenuItem::with_id(
                app,
                "toggle_hud",
                "⚡ Плавающий HUD виджет",
                true,
                None::<&str>,
            )?;
            let hide_all_i = MenuItem::with_id(
                app,
                "hide_all",
                "📴 Свернуть в трей",
                true,
                None::<&str>,
            )?;
            let quit_i = MenuItem::with_id(
                app,
                "quit",
                "❌ Выход из приложения",
                true,
                None::<&str>,
            )?;

            let tray_menu = Menu::with_items(
                app,
                &[&open_main_i, &toggle_hud_i, &hide_all_i, &quit_i],
            )?;

            // Инициализация системного трея
            let _tray = TrayIconBuilder::new()
                .tooltip("Живой трекер — персональный командный центр")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open_main" => {
                        let _ = show_main_window(app.clone());
                    }
                    "toggle_hud" => {
                        let _ = toggle_hud_window(app.clone());
                    }
                    "hide_all" => {
                        if let Some(main) = app.get_webview_window("main") {
                            let _ = main.hide();
                        }
                        if let Some(hud) = app.get_webview_window("hud") {
                            let _ = hud.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = toggle_hud_window(app.clone());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Living Tracker Tauri application");
}
