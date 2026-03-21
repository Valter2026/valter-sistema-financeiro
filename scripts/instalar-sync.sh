#!/bin/bash
# Instala o sync automático a cada 30 minutos no Mac
# Execute: bash scripts/instalar-sync.sh

NODE="/Users/acheimeuiphone/.nvm/versions/node/v20.20.1/bin/node"
SCRIPT="/Users/acheimeuiphone/valter-crm/scripts/sync.mjs"
LOG="/Users/acheimeuiphone/valter-crm/scripts/sync.log"
CRON_LINE="*/30 * * * * $NODE $SCRIPT >> $LOG 2>&1"

# Adiciona ao crontab sem duplicar
(crontab -l 2>/dev/null | grep -v "sync.mjs"; echo "$CRON_LINE") | crontab -

echo "✅ Sync automático instalado! Roda a cada 30 minutos."
echo "📋 Crontab atual:"
crontab -l
echo ""
echo "📄 Logs em: $LOG"
echo "▶️  Para ver logs ao vivo: tail -f $LOG"
