import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
// import { fetchFile } from '@ffmpeg/util';

const Edit = () => {
    const [videoFiles, setVideoFiles] = useState({ video1: null, video2: null });
    const [progress, setProgress] = useState(0);
    const [outputVideo, setOutputVideo] = useState(null);
    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();

    // Handle file selection
    const handleFileChange = (e, videoKey) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFiles((prev) => ({
                ...prev,
                [videoKey]: URL.createObjectURL(file),
            }));
        }
    };

    // Rotate video
    const handleRotateVideo = async (videoKey, degrees) => {
        try {
            if (!ffmpeg.loaded) {
                await ffmpeg.load();
            }

            const fileInput = document.querySelector(`#${videoKey}`);
            if (fileInput.files[0]) {
                await ffmpeg.writeFile(`${videoKey}.mp4`, await fetchFile(fileInput.files[0]));

                // Rotate the video using transpose filter
                await ffmpeg.exec([
                    '-i', `${videoKey}.mp4`,
                    '-vf', `transpose=${degrees === 90 ? 1 : 2}`,
                    '-c:a', 'copy',
                    `rotated_${videoKey}.mp4`
                ]);

                // Read processed file
                const data = await ffmpeg.readFile(`rotated_${videoKey}.mp4`);
                const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
                const videoUrl = URL.createObjectURL(videoBlob);

                // Update the video preview
                setVideoFiles((prev) => ({
                    ...prev,
                    [videoKey]: videoUrl,
                }));
            }
        } catch (error) {
            console.error('Error al rotar el video:', error);
        }
    };

    // Trim video
    const handleTrimVideo = async (videoKey, startTime, endTime) => {
        try {
            if (!ffmpeg.loaded) {
                await ffmpeg.load();
            }

            const fileInput = document.querySelector(`#${videoKey}`);
            if (fileInput.files[0]) {
                await ffmpeg.writeFile(`${videoKey}.mp4`, await fetchFile(fileInput.files[0]));

                // Trim the video using -ss and -t options
                await ffmpeg.exec([
                    '-i', `${videoKey}.mp4`,
                    '-ss', `${startTime}`,
                    '-t', `${endTime - startTime}`,
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    `trimmed_${videoKey}.mp4`
                ]);

                // Read processed file
                const data = await ffmpeg.readFile(`trimmed_${videoKey}.mp4`);
                const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
                const videoUrl = URL.createObjectURL(videoBlob);

                // Update the video preview
                setVideoFiles((prev) => ({
                    ...prev,
                    [videoKey]: videoUrl,
                }));
            }
        } catch (error) {
            console.error('Error al recortar el video:', error);
        }
    };

    // Adjust brightness
    const handleBrightnessAdjustment = async (videoKey, brightnessValue) => {
        try {
            if (!ffmpeg.loaded) {
                await ffmpeg.load();
            }

            const fileInput = document.querySelector(`#${videoKey}`);
            if (fileInput.files[0]) {
                await ffmpeg.writeFile(`${videoKey}.mp4`, await fetchFile(fileInput.files[0]));

                // Adjust brightness using eq filter
                await ffmpeg.exec([
                    '-i', `${videoKey}.mp4`,
                    '-vf', `eq=brightness=${brightnessValue}`,
                    '-c:a', 'copy',
                    `brightened_${videoKey}.mp4`
                ]);

                // Read processed file
                const data = await ffmpeg.readFile(`brightened_${videoKey}.mp4`);
                const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
                const videoUrl = URL.createObjectURL(videoBlob);

                // Update the video preview
                setVideoFiles((prev) => ({
                    ...prev,
                    [videoKey]: videoUrl,
                }));
            }
        } catch (error) {
            console.error('Error al ajustar el brillo:', error);
        }
    };

    // Process videos
    const handleSaveChanges = async () => {
        if (!videoFiles.video1 && !videoFiles.video2) {
            alert('Por favor, selecciona al menos un video.');
            return;
        }

        // Progress simulation
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 500);

        await processVideos();
    };

    const processVideos = async () => {
        try {
            if (!ffmpeg.loaded) {
                await ffmpeg.load();
            }

            ffmpeg.on('log', () => {});
            ffmpeg.on('progress', ({ ratio }) => {
                setProgress(Math.round(ratio * 100));
            });

            const fileInput1 = document.querySelector('#video1');
            const fileInput2 = document.querySelector('#video2');

            if (fileInput1.files[0]) {
                await ffmpeg.writeFile('input1.mp4', await fetchFile(fileInput1.files[0]));
            }
            if (fileInput2.files[0]) {
                await ffmpeg.writeFile('input2.mp4', await fetchFile(fileInput2.files[0]));
            }

            if (fileInput1.files[0] && fileInput2.files[0]) {
                await ffmpeg.exec([
                    '-i', 'input1.mp4',
                    '-i', 'input2.mp4',
                    '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]',
                    '-map', '[v]', '-map', '[a]',
                    'output.mp4'
                ]);
            } else if (fileInput1.files[0]) {
                await ffmpeg.exec([
                    '-i', 'input1.mp4',
                    '-t', '10',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    'output.mp4'
                ]);
            } else if (fileInput2.files[0]) {
                await ffmpeg.exec([
                    '-i', 'input2.mp4',
                    '-t', '10',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    'output.mp4'
                ]);
            }

            const data = await ffmpeg.readFile('output.mp4');
            const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
            const videoUrl = URL.createObjectURL(videoBlob);
            setOutputVideo(videoUrl);  // Actualizar el estado con la URL del video generado
            await ffmpeg.terminate();
        } catch (error) {
            console.error('Error al procesar los videos:', error);
        }
    };


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Video Creating
                </h2>
            }
        >
            <Head title="Video" />
            <div className="min-h-screen  flex flex-col justify-center items-center py-10 px-4">
                <div className="w-full max-w-4xl  dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">
                        Editar Videos
                    </h1>

                    {/* Video player 1 */}
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">Video 1</h3>
                        {videoFiles.video1 ? (
                            <div className="mb-4">
                                <video className="w-full h-auto" controls>
                                    <source src={videoFiles.video1} type="video/mp4" />
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center border-2 border-dashed border-gray-400 rounded-md p-10">
                                <input
                                    id="video1"
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileChange(e, 'video1')}
                                    className="cursor-pointer text-gray-600"
                                />
                            </div>
                        )}
                    </div>

                    {/* Video player 2 */}
                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">Video 2</h3>
                        {videoFiles.video2 ? (
                            <div className="mb-4">
                                <video className="w-full h-auto" controls>
                                    <source src={videoFiles.video2} type="video/mp4" />
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center border-2 border-dashed border-gray-400 rounded-md p-10">
                                <input
                                    id="video2"
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileChange(e, 'video2')}
                                    className="cursor-pointer text-gray-600"
                                />
                            </div>
                        )}
                    </div>

                    {/* Editing options */}
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">Opciones de Edición</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleRotateVideo('video1', 90)}
                                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-700"
                            >
                                Rotar Video 1 (90°)
                            </button>
                            <button
                                onClick={() => handleTrimVideo('video1', 5, 15)}
                                className="bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-700"
                            >
                                Recortar Video 1 (5s-15s)
                            </button>
                            <button
                                onClick={() => handleBrightnessAdjustment('video1', 0.5)}
                                className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                            >
                                Ajustar Brillo Video 1
                            </button>
                        </div>
                    </div>
                    <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-700 dark:text-white mb-2">Video Finalizado</h3>
                            {outputVideo ? (
                                <div className="mb-4">
                                    <video className="w-full h-auto" controls>
                                        <source src={outputVideo} type="video/mp4" />
                                        Tu navegador no soporta el elemento de video.
                                    </video>
                                </div>
                            ) : (
                                <p>No hay video generado aún.</p>
                            )}
                    </div>


                    {/* Save button */}
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={handleSaveChanges}
                            className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Guardar cambios
                        </button>
                        {progress > 0 && (
                            <div className="w-full mt-4">
                                <div className="w-full bg-gray-300 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-center text-sm text-gray-500 mt-2">{progress}% Completado</p>
                            </div>
                        )}
                    </div>

                    {/* Output video preview */}
                    {outputVideo && (
                        <div className="mt-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Video Procesado:
                            </h2>
                            <video className="w-full h-auto" controls>
                                <source src={outputVideo} type="video/mp4" />
                                Tu navegador no soporta el elemento de video.
                            </video>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;