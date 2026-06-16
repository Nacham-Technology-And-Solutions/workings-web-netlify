export default function CuttingListPage() {
  return (
    <div className="bg-white">
      <div className="min-h-screen p-6 print:p-8 mt-20">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">CUTTING LIST</h1>
          </div>
          <div className="bg-gray-800 text-white px-8 py-3 font-bold text-sm">
            Logo
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 bg-gray-100">
          <div className="px-6 py-2 text-gray-600 text-xs"> Layout </div>
          <div className="px-6 py-2 text-gray-600 text-xs">Repetition</div>
          <div className="px-6 py-2 text-gray-600 text-xs">Off-cuts</div>
        </div>

        {/* Layout A */}
        <div className="mb-6 border border-gray-300 p-6">
          <div className="flex justify-between w-full mb-6 text-sm">
            <div className="flex gap-20">
              <div className="font-semibold w-8">A</div>
              <div className="text-gray-600 w-8">4X</div>
              <div className="text-gray-600">1.5m</div>
            </div>
            <div className="grid grid-cols-2 gap-20 mb-6">
              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut/Length</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold w-16">1800</span>
                    <span className="text-gray-600">2 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">1 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold w-16">700</span>
                    <span className="text-gray-600">1 pcs</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut across repetition</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold w-16">1800</span>
                    <span className="text-gray-600">8 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">4 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold w-16">700</span>
                    <span className="text-gray-600">4 pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted separator */}
          <div className="border-t border-dashed border-gray-400 mb-4"></div>

          {/* Bar Visualization */}
          <div className="flex h-12 border border-gray-300">
            <div className="flex-1 bg-green-500 flex items-center justify-center text-white font-bold text-sm border-r border-gray-300">
              1.8m
            </div>
            <div className="flex-1 bg-green-500 flex items-center justify-center text-white font-bold text-sm border-r border-gray-300">
              1.8m
            </div>
            <div className="flex-1 bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="w-20 bg-blue-500 flex items-center justify-center text-white font-bold text-sm border-r border-gray-300">
              0.7m
            </div>
            <div className="w-4 bg-white border-l border-gray-300 flex items-center justify-center relative">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Layout B */}
        <div className="mb-6 border border-gray-300 p-6">
          <div className="flex justify-between w-full mb-6 text-sm">
            <div className="flex gap-20">
              <div className="font-semibold w-8">B</div>
              <div className="text-gray-600 w-8">2X</div>
              <div className="text-gray-600">0.2m</div>
            </div>
            <div className="grid grid-cols-2 gap-20 mb-6">
              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut/Length</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold w-16">1800</span>
                    <span className="text-gray-600">1 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">3 pcs</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut across repetition</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold w-16">1800</span>
                    <span className="text-gray-600">2 pcs</span>
                  </div>
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">6 pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted separator */}
          <div className="border-t border-dashed border-gray-400 mb-4"></div>

          {/* Bar Visualization */}
          <div className="flex h-12 border border-gray-300">
            <div className="flex-1 bg-green-500 flex items-center justify-center text-white font-bold text-sm border-r border-gray-300">
              1.8m
            </div>
            <div className="flex-1 bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="flex-1 bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="flex-1 bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="w-4 bg-white border-l border-gray-300 flex items-center justify-center relative">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Layout C */}
        <div className="mb-6 border border-gray-300 p-6">
          <div className="flex justify-between w-full mb-6 text-sm">
            <div className="flex gap-20">
              <div className="font-semibold w-8">C</div>
              <div className="text-gray-600 w-8">1X</div>
              <div className="text-gray-600">0.2m</div>
            </div>
            <div className="grid grid-cols-2 gap-20 mb-6">
              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut/Length</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">4 pcs</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-[#545454] mb-2 px-3 py-2 rounded bg-[#EDEDED] font-semibold">Cut across repetition</div>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center text-sm rounded border border-[#EDEDED] px-3 py-2">
                    <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                    <span className="font-semibold w-16">1200</span>
                    <span className="text-gray-600">4 pcs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted separator */}
          <div className="border-t border-dashed border-gray-400 mb-4"></div>

          {/* Bar Visualization */}
          <div className="flex h-12 border border-gray-300">
            <div className="flex-1 bg-pink-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.8m
            </div>
            <div className="flex-1 bg-pink-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="flex-1 bg-pink-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="flex-1 bg-pink-400 flex items-center justify-center text-gray-900 font-bold text-sm border-r border-gray-300">
              1.2m
            </div>
            <div className="w-4 bg-white border-l border-gray-300 flex items-center justify-center relative">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white py-3 px-6 flex justify-between text-xs fixed bottom-0 left-0 right-0">
          <span>www.workingltd.com</span>
          <span>workingltd@gmail.com</span>
          <span>+2349066188037</span>
        </div>
      </div>
    </div>
  )
}
