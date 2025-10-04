import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';

const ImageRecognition = () => {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');
    const [model, setModel] = useState(null);

    // Load the model when the component mounts
    useEffect(() => {
        const loadModel = async () => {
            const loadedModel = await mobilenet.load();
            setModel(loadedModel);
        };
        loadModel();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };

    const recognizeImage = useCallback(async (imgElement) => {
        if (model && imgElement) {
            const predictions = await model.classify(imgElement);
            setResult(predictions[0].className);
        }
    }, [model]);

    const imgRef = useRef(null);

    // Call recognizeImage when the image is loaded
    useEffect(() => {
        if (image && imgRef.current) {
            const imgElement = imgRef.current;
            imgElement.onload = () => recognizeImage(imgElement);
        }
    }, [image, model, recognizeImage]);

    return (
        <div>
            <input type="file" onChange={handleImageUpload} />
                    <img ref={imgRef} src={image} alt="uploaded" />
                <div>
                    <img id="uploadedImage" src={image} alt="uploaded" />
                    <p>Result: {result}</p>
                </div>
        </div>
    );
};

export default ImageRecognition;
