export class StandardScaler {
  means: number[] = [];
  stds: number[] = [];
  isFitted = false;

  fit(data: number[][]): void {
    if (data.length === 0 || data[0].length === 0) return;
    const numFeatures = data[0].length;
    this.means = new Array(numFeatures).fill(0);
    this.stds = new Array(numFeatures).fill(0);

    for (const row of data) {
      for (let j = 0; j < numFeatures; j++) {
        this.means[j] += row[j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      this.means[j] /= data.length;
    }

    for (const row of data) {
      for (let j = 0; j < numFeatures; j++) {
        const diff = row[j] - this.means[j];
        this.stds[j] += diff * diff;
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      this.stds[j] = Math.sqrt(this.stds[j] / (data.length || 1));
      if (this.stds[j] === 0 || isNaN(this.stds[j])) {
        this.stds[j] = 1.0;
      }
    }
    this.isFitted = true;
  }

  transform(data: number[][]): number[][] {
    if (!this.isFitted) return data;
    return data.map((row) =>
      row.map((val, j) => {
        const std = this.stds[j] || 1.0;
        return (val - (this.means[j] || 0)) / std;
      })
    );
  }

  fitTransform(data: number[][]): number[][] {
    this.fit(data);
    return this.transform(data);
  }

  transformVector(vec: number[]): number[] {
    if (!this.isFitted) return vec;
    return vec.map((val, j) => {
      const std = this.stds[j] || 1.0;
      return (val - (this.means[j] || 0)) / std;
    });
  }
}
