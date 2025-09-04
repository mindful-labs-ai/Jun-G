// "use client";

// import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Upload,
//   Loader2,
//   Download,
//   X,
//   FileImage,
//   Sparkles,
// } from "lucide-react";

// interface UploadedImage {
//   name: string;
//   base64: string;
//   dataUrl: string;
//   mimeType: string;
// }

// interface GeneratedImage {
//   dataUrl: string;
//   timestamp: Date;
// }

// export function GeminiImageWithUpload() {
//   const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
//     null
//   );
//   const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
//   const [prompt, setPrompt] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [dragActive, setDragActive] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // 파일을 Base64로 변환
//   const fileToBase64 = (file: File): Promise<UploadedImage> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();

//       reader.onload = () => {
//         const dataUrl = reader.result as string;
//         const base64 = dataUrl.split(",")[1];

//         resolve({
//           name: file.name,
//           base64,
//           dataUrl,
//           mimeType: file.type,
//         });
//       };

//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   };

//   // 파일 처리
//   const processFile = async (file: File) => {
//     if (!file.type.startsWith("image/")) {
//       setError("이미지 파일만 업로드 가능합니다.");
//       return;
//     }

//     try {
//       const convertedImage = await fileToBase64(file);
//       setUploadedImage(convertedImage);
//       setError(null);
//     } catch (err) {
//       setError("이미지 변환 실패");
//     }
//   };

//   // 드래그 앤 드롭 핸들러
//   const handleDrag = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       processFile(e.dataTransfer.files[0]);
//     }
//   };

//   // 파일 선택 핸들러
//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       processFile(e.target.files[0]);
//     }
//   };

//   // Gemini API 호출
//   const generateWithGemini = async () => {
//     if (!uploadedImage || !prompt.trim()) {
//       setError("이미지와 프롬프트를 모두 입력해주세요.");
//       return;
//     }

//     setIsGenerating(true);
//     setError(null);

//     try {
//       const response = await fetch("/api/image-gen/scene-1", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           prompt: prompt,
//           imageBase64: uploadedImage.base64,
//           imageMimeType: uploadedImage.mimeType,
//         }),
//       });

//       console.log({
//         prompt: prompt,
//         imageBase64: uploadedImage.base64,
//         imageMimeType: uploadedImage.mimeType,
//       });

//       if (!response.ok) {
//         console.log("에러남");
//         throw new Error("이미지 생성 실패");
//       }

//       const data = await response.json();

//       console.log(data);

//       if (data.generatedImage) {
//         setGeneratedImages((prev) => {
//           return [
//             ...prev,
//             {
//               dataUrl: `data:image/png;base64,${data.generatedImage}`,
//               timestamp: new Date(),
//             },
//           ];
//         });
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "알 수 없는 오류");
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   // 이미지 다운로드
//   const downloadImage = (dataUrl: string, index: number) => {
//     const link = document.createElement("a");
//     link.href = dataUrl;
//     link.download = `gemini-generated-${index + 1}.png`;
//     link.click();
//   };

//   // 초기화
//   const reset = () => {
//     setUploadedImage(null);
//     setGeneratedImages([]);
//     setPrompt("");
//     setError(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
//       <div className="grid md:grid-cols-2 gap-6">
//         {/* 왼쪽: 업로드 섹션 */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">1. 참조 이미지 업로드</h3>

//           {!uploadedImage ? (
//             <div
//               className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
//                 dragActive
//                   ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
//                   : "border-gray-300 dark:border-gray-600"
//               }`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//             >
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileInput}
//                 className="hidden"
//               />

//               <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />

//               <p className="text-sm mb-4">
//                 이미지를 드래그하거나 클릭하여 업로드
//               </p>

//               <Button
//                 onClick={() => fileInputRef.current?.click()}
//                 variant="outline"
//               >
//                 <Upload className="mr-2 h-4 w-4" />
//                 이미지 선택
//               </Button>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               <div className="relative">
//                 <img
//                   src={uploadedImage.dataUrl}
//                   alt="Uploaded"
//                   className="w-full rounded-lg border"
//                 />
//                 <Button
//                   variant="destructive"
//                   size="sm"
//                   className="absolute top-2 right-2"
//                   onClick={() => setUploadedImage(null)}
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//               <p className="text-sm text-gray-500">
//                 파일명: {uploadedImage.name}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* 오른쪽: 프롬프트 섹션 */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">2. 생성 프롬프트 입력</h3>

//           <Textarea
//             placeholder="예: Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation"
//             value={prompt}
//             onChange={(e) => setPrompt(e.target.value)}
//             className="min-h-[150px]"
//           />

//           <Button
//             onClick={generateWithGemini}
//             disabled={!uploadedImage || !prompt.trim() || isGenerating}
//             className="w-full"
//           >
//             {isGenerating ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 생성 중...
//               </>
//             ) : (
//               <>
//                 <Sparkles className="mr-2 h-4 w-4" />
//                 Gemini로 이미지 생성
//               </>
//             )}
//           </Button>

//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
//               {error}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 생성된 이미지 섹션 */}
//       {generatedImages.length > 0 && (
//         <div className="space-y-4">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold">
//               생성된 이미지 ({generatedImages.length})
//             </h3>
//             <Button variant="outline" size="sm" onClick={reset}>
//               <X className="mr-2 h-4 w-4" />
//               전체 초기화
//             </Button>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {generatedImages.map((image, index) => (
//               <div key={index} className="relative group">
//                 <img
//                   src={image.dataUrl}
//                   alt={`Generated ${index + 1}`}
//                   className="w-full rounded-lg border"
//                 />
//                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
//                   <Button
//                     variant="secondary"
//                     size="sm"
//                     onClick={() => downloadImage(image.dataUrl, index)}
//                   >
//                     <Download className="mr-2 h-4 w-4" />
//                     다운로드
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
