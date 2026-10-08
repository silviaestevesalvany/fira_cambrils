# Totselecta · Fira Cambrils

App mòbil (web instal·lable) per recollir contactes comercials a la fira. Cada
contacte s'afegeix com una fila nova al full de càlcul
**Recogida datos leads fira Cambrils**.

Camps: nom del restaurant, nom del client, població, telèfon, correu, vins
d'interès (8 caselles) i notes. A la columna **H** s'hi afegeix la data i hora.

Funciona **sense connexió**: si a la fira no hi ha cobertura, el contacte queda
desat al mòbil i s'envia sol quan torna la connexió (o prement *Tornar a enviar
ara*).

---

## Posada en marxa (una sola vegada, ~10 minuts)

### 1. Connectar el full de càlcul (Apps Script)

1. Obre el full de càlcul → **Extensions → Apps Script**.
2. Esborra el contingut de `Code.gs` i enganxa-hi el de
   [`apps-script/Code.gs`](apps-script/Code.gs). Desa.
3. **Implementa → Implementació nova** → tipus **Aplicació web**:
   - *Executa com a:* **Jo**
   - *Qui hi té accés:* **Qualsevol persona**
4. Autoritza els permisos que demana Google.
5. Copia la **URL de l'aplicació web** (acaba en `/exec`).

### 2. Posar la URL a l'app

Obre [`config.js`](config.js) i substitueix `ENGANXA_AQUI_LA_URL_DE_L_APPS_SCRIPT`
per la URL copiada.

### 3. Publicar l'app (GitHub Pages)

Al repositori de GitHub: **Settings → Pages → Build and deployment** →
*Source:* **Deploy from a branch** → branca `main` (o la que tingui el codi),
carpeta `/ (root)`. En un minut l'app serà a
`https://silviaestevesalvany.github.io/fira_cambrils/`.

### 4. Instal·lar-la als mòbils

- **iPhone (Safari):** obre l'enllaç → botó Compartir → **Afegeix a la pantalla d'inici**.
- **Android (Chrome):** obre l'enllaç → menú ⋮ → **Instal·la l'aplicació**.

Obre-la un cop amb connexió abans de la fira perquè quedi desada per funcionar
sense cobertura.

---

## Canviar la llista de vins

Edita la llista `VINS` de [`config.js`](config.js).

## Seguretat

El `TOKEN` de `config.js` i `apps-script/Code.gs` ha de ser el mateix. Si el
canvies, canvia'l als dos llocs i torna a implementar l'Apps Script
(*Implementa → Gestiona les implementacions → editar → Versió nova*).
