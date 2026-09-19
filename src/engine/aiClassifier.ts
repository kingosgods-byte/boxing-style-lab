import * as tf from '@tensorflow/tfjs';

export class BoxingAIModel {
  private model: tf.Sequential | null = null;

  public async initializeModel() {
    // 33 Pose Landmarks x 3 coordinates (X, Y, Z) = 99 Input Features
    this.model = tf.sequential();
    
    this.model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      inputShape: [99]
    }));
    
    this.model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    // Output probabilities: [Idle, Jab, Cross, Hook]
    this.model.add(tf.layers.dense({
      units: 4,
      activation: 'softmax'
    }));

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
  }

  public predict(landmarks: { x: number; y: number; z: number }[]) {
    if (!this.model) return null;

    // Flatten landmarks to 1D vector of 99 features
    const inputVector = landmarks.flatMap(l => [l.x, l.y, l.z]);
    return tf.tidy(() => {
      const tensor = tf.tensor2d([inputVector]);
      const prediction = this.model!.predict(tensor) as tf.Tensor;
      return prediction.dataSync(); // Returns probabilities array
    });
  }
}
