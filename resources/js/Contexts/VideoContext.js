// src/Contexts/VideoContext.js

import React, { createContext, useContext, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const VideoContext = createContext();

export const useVideoContext = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
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
            setOutputVideo(videoUrl);
            await ffmpeg.terminate();
        } catch (error) {
            console.error('Error al procesar los videos:', error);
        }
    };

    return (
        <VideoContext.Provider
            value={{
                videoFiles,
                setVideoFiles,
                progress,
                setProgress,
                outputVideo,
                setOutputVideo,
                handleFileChange,
                handleRotateVideo,
                handleTrimVideo,
                handleBrightnessAdjustment,
                handleSaveChanges,
                processVideos,
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};
