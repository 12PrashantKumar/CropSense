# AI-Based Crop Disease Detection System

![Crop Disease Detection System Banner](https://via.placeholder.com/1200x400.png?text=Crop+Disease+Detection+System)

## Overview
This is an advanced, AI-powered system designed to diagnose crop diseases accurately from images. By leveraging Convolutional Neural Networks (CNN) achieving over 85% accuracy and a modern web stack, this project offers farmers and agriculturists a fast, reliable tool for identifying plant diseases and getting actionable recommendations.

## Ecosystem & Features
- **Real-Time Image Classification**: Upload a picture of a crop leaf and receive an instant diagnosis.
- **High Accuracy Model**: Custom CNN architecture trained on a diverse dataset covering Corn, Potato, Rice, Sugarcane, and Wheat.
- **History Tracking**: Keeps a secure log of all past predictions for users, accessible via a personal dashboard.
- **Account Security**: JWT-based authentication to ensure that diagnostic history is kept private.
- **Scalable Backend**: Built with FastAPI for speed and PostgreSQL for robust data management.
- **Modern User Interface**: A dynamic, premium web experience crafted with Next.js and TailwindCSS.

## Technologies Used
- **Machine Learning**: Python, TensorFlow/Keras or PyTorch, OpenCV
- **Backend API**: Python, FastAPI, SQLAlchemy, PostgreSQL, PyJWT
- **Frontend Stack**: Next.js 14, React, TypeScript, TailwindCSS
- **Dataset**: Covered crops include Corn (Rust, Blight, Spot), Potato (Blights), Rice (Blast, Brown Spot), Sugarcane (Rot, Blight), and Wheat (Rusts).

## Project Structure
```
.
├── backend/            # FastAPI application and PostgreSQL database integration
├── frontend/           # Next.js web application
├── model/              # CNN training scripts, model artifacts, and data loaders
├── DataSet/            # Contains 17 classes of crop leaf images used for training
└── README.md
```

## Setup & Installation
### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Git

*(Detailed setup steps for each component will be generated as development progresses).*

## Future Scope
- Integration with local weather APIs to predict disease outbreak probabilities.
- Mobile application using React Native.
- Multi-language support for regional farming communities.

---
*This project was built to promote sustainable agriculture and leverage cutting-edge AI for food security.*
