#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      #[cfg(target_os = "linux")]
      allow_microphone(app)?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

/// Linux (WebKitGTK): wry neither enables media streams nor answers permission requests, so
/// Speaking tasks could not record, and a later prompt would interrupt the assessment's fullscreen.
/// The app only loads its own bundled frontend: grant microphone-only requests and deny camera and
/// screen capture.
#[cfg(target_os = "linux")]
fn allow_microphone(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  use tauri::Manager;
  use webkit2gtk::glib::object::Cast;
  use webkit2gtk::{PermissionRequestExt, SettingsExt, UserMediaPermissionRequest, UserMediaPermissionRequestExt, WebViewExt};

  if let Some(window) = app.get_webview_window("main") {
    window.with_webview(|webview| {
      let view = webview.inner();
      if let Some(settings) = WebViewExt::settings(&view) {
        settings.set_enable_media_stream(true);
      }
      view.connect_permission_request(|_, request| {
        if let Some(media) = request.downcast_ref::<UserMediaPermissionRequest>() {
          if media.is_for_audio_device() && !media.is_for_video_device() {
            request.allow();
          } else {
            request.deny();
          }
          return true;
        }
        false
      });
    })?;
  }
  Ok(())
}
