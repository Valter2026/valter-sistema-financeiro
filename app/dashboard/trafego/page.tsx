'use client'

export default function TrafegoPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-white">Tráfego Pago</h2>
        <p className="text-gray-400 text-sm mt-1">Meta Ads — Facebook & Instagram</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-700">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-white mb-2">Integração Meta Ads</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Para conectar seus dados de campanha (ROAS, CPV, CTR, CPC), precisamos do seu
          <strong className="text-white"> Token de Acesso da Meta Business Suite</strong>.
        </p>
        <div className="bg-gray-800 rounded-xl p-4 text-left max-w-md mx-auto">
          <p className="text-xs text-gray-400 mb-2 font-semibold">Como obter:</p>
          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Acesse business.facebook.com</li>
            <li>Configurações → Usuários do Sistema</li>
            <li>Gere um token com permissão <code className="text-blue-400">ads_read</code></li>
            <li>Me passe o token e seu Ad Account ID</li>
          </ol>
        </div>
        <p className="text-xs text-gray-500 mt-4">Pixel ID já configurado: 4503108759932017</p>
      </div>
    </div>
  )
}
