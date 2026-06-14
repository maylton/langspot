# LangSpot Desktop para Linux

O projeto inclui uma configuração Tauri 2 para gerar um aplicativo Linux usando a mesma interface React da versão web.

## 1. Restaurar o ambiente

Copie seu `.env` para a raiz do projeto. As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são incorporadas ao frontend durante o build. Não envie o `.env` ao GitHub.

## 2. Instalar dependências no CachyOS/Arch

```bash
./scripts/setup-tauri-arch.sh
```

Feche e abra o terminal caso `cargo` ainda não seja reconhecido. Confira:

```bash
rustc --version
cargo --version
```

## 3. Testar o aplicativo desktop

```bash
npm ci
npm run desktop
```

O Tauri iniciará o Vite e abrirá a janela nativa.

## 4. Gerar o AppImage

```bash
./scripts/build-appimage.sh
```

O arquivo será criado em:

```text
src-tauri/target/release/bundle/appimage/
```

Para executar:

```bash
chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage
```

## Build pelo GitHub Actions

O workflow `.github/workflows/build-linux.yml` produz um AppImage em Ubuntu 22.04, que oferece melhor compatibilidade com distribuições Linux mais antigas.

Crie estes secrets no repositório:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois abra **Actions → Build Linux AppImage → Run workflow**. O AppImage ficará disponível nos artefatos da execução.

## Observações

- A versão desktop continua dependendo de internet para sincronizar dados com o Supabase.
- O `.env` é usado apenas durante o build; as variáveis Vite ficam embutidas no aplicativo final.
- Para ampla compatibilidade, prefira distribuir o AppImage criado no runner Ubuntu 22.04 em vez do compilado diretamente em uma distribuição rolling release.
