from flask import Flask, request
from moviepy.editor import *
from PIL import Image
import glob
import numpy as np
from moviepy.editor import ImageClip, concatenate_videoclips
from moviepy.audio.io.AudioFileClip import AudioFileClip
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import dotenv
from scipy.io import wavfile


app = Flask(__name__)

mongo_uri = dotenv.get_key('./.env', 'MONGO_URI')
app.config['MONGO_URI'] = mongo_uri
mongo = PyMongo(app)

image_folder = "C:\Programming\SIH\images"


@app.route('/', methods=['GET', 'POST'])
def home():
    return {'msg': 'hello'}


@app.route('/video', methods=['GET', 'POST'])
def generate_video():
    data = request.get_json()
    video_name = data['video_name']
    audio_name = data['audio_name']
    audio_path = f"C:\\Programming\\SIH\\audios\\{audio_name}.wav"

    Fs, data = wavfile.read(audio_path)
    n = len(data)
    total_audio_duration = n / Fs

    frame_rate = 24
    image_files = [os.path.join(image_folder, filename) for filename in os.listdir(
        image_folder) if filename.endswith(('.jpg', '.png', '.jpeg'))]
    image_duration = total_audio_duration/len(image_files)
    image_clips = []

    output_video_path = f"C:\\Programming\\SIH\\videos\\{video_name}.mp4"

    for image_path in image_files:
        image_clip = ImageClip(image_path)
        image_clip = image_clip.set_duration(image_duration)
        image_clips.append(image_clip)

    final_video = concatenate_videoclips(image_clips, method="compose")
    audio_clip = AudioFileClip(audio_path)

    final_video = final_video.set_audio(audio_clip)
    final_video.write_videofile(output_video_path, fps=24)
    return {'message': 'Video Created'}


if __name__ == "__main__":
    app.run(port=5555, debug=True)
