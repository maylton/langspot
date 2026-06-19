# Android

O app Android usa Capacitor para empacotar a versão web do LangSpot em um projeto nativo Android.

## Comandos principais

```bash
npm run android:sync
```

Gera o build web e sincroniza os arquivos com o projeto Android.

```bash
npm run android:open
```

Abre o projeto Android no Android Studio. No Linux desta máquina, o script já aponta para `/usr/bin/android-studio`.

```bash
npm run android:build
```

Gera um APK debug local em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Observações

- As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` continuam sendo lidas pelo build web.
- A chave do Gemini continua protegida no Supabase Edge Function, não dentro do app Android.
- Depois de mudanças no frontend, rode `npm run android:sync` antes de testar no Android Studio.
- Para gerar o APK, o Android SDK precisa estar configurado. O Android Studio normalmente cria o arquivo `android/local.properties` com o caminho `sdk.dir` ao abrir o projeto pela primeira vez.
