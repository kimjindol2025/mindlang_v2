/**
 * PostMindLang Visualization Module
 * Vector space, gradient flow, and ensemble analysis visualization
 * ~400 lines
 */

import { PostMindLangRuntime, VectorTensor } from './integration';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
  label?: string;
  color?: string;
  size?: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface GradientFlowData {
  layer: number;
  gradient_magnitude: number;
  gradient_direction: number[];
}

export interface WeightEvolution {
  epoch: number;
  weights_snapshot: number[];
  path_contributions: number[];
}

export interface TrajectoryPoint {
  step: number;
  vector: VectorTensor;
  projection_2d: Point2D;
}

// ============================================================================
// Dimension Reduction Methods
// ============================================================================

class DimensionReducer {
  /**
   * Simple PCA projection to 2D
   */
  static pca_2d(vectors: VectorTensor[]): Point2D[] {
    if (vectors.length === 0) return [];

    // Center the data
    const mean = this.compute_mean(vectors);
    const centered = vectors.map((v) => this.subtract(v, mean));

    // Compute covariance and eigenvalues
    const cov = this.compute_covariance(centered);
    const eigen = this.approximate_eigenvectors(cov, 2);

    // Project to 2D
    return vectors.map((v, idx) => ({
      x: this.dot(v, eigen[0]) / 10,
      y: this.dot(v, eigen[1]) / 10,
      label: `v${idx}`,
    }));
  }

  /**
   * t-SNE projection (simplified)
   */
  static tsne_2d(vectors: VectorTensor[], perplexity: number = 30): Point2D[] {
    if (vectors.length === 0) return [];

    // Initialize with random 2D points
    const points: Point2D[] = vectors.map(() => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
    }));

    const n_iter = 100;
    const learning_rate = 200;

    for (let iter = 0; iter < n_iter; iter++) {
      for (let i = 0; i < points.length; i++) {
        let grad_x = 0;
        let grad_y = 0;

        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;

          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist_sq = dx * dx + dy * dy + 1e-8;

          const p_ij = this.compute_gaussian_affinity(vectors[i], vectors[j]);
          const q_ij = 1 / (1 + dist_sq);

          const coeff = (p_ij - q_ij) * q_ij;
          grad_x += coeff * dx;
          grad_y += coeff * dy;
        }

        points[i].x -= learning_rate * grad_x;
        points[i].y -= learning_rate * grad_y;
      }
    }

    return points;
  }

  /**
   * Compute Gaussian affinity
   */
  private static compute_gaussian_affinity(v1: VectorTensor, v2: VectorTensor): number {
    let dist_sq = 0;
    for (let i = 0; i < v1.data.length; i++) {
      const diff = v1.data[i] - v2.data[i];
      dist_sq += diff * diff;
    }
    return Math.exp(-dist_sq / 2);
  }

  /**
   * Compute mean vector
   */
  private static compute_mean(vectors: VectorTensor[]): VectorTensor {
    const dim = vectors[0].data.length;
    const mean = new Float64Array(dim);

    for (const v of vectors) {
      for (let i = 0; i < dim; i++) {
        mean[i] += v.data[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      mean[i] /= vectors.length;
    }

    return { data: mean, shape: vectors[0].shape };
  }

  /**
   * Subtract two vectors
   */
  private static subtract(v1: VectorTensor, v2: VectorTensor): VectorTensor {
    const result = new Float64Array(v1.data.length);
    for (let i = 0; i < v1.data.length; i++) {
      result[i] = v1.data[i] - v2.data[i];
    }
    return { data: result, shape: v1.shape };
  }

  /**
   * Compute covariance matrix (simplified)
   */
  private static compute_covariance(vectors: VectorTensor[]): number[][] {
    const dim = Math.min(vectors[0].data.length, 50); // Limit for performance
    const cov: number[][] = Array(dim)
      .fill(0)
      .map(() => Array(dim).fill(0));

    for (const v of vectors) {
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          cov[i][j] += v.data[i] * v.data[j];
        }
      }
    }

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        cov[i][j] /= vectors.length;
      }
    }

    return cov;
  }

  /**
   * Approximate eigenvectors using power iteration
   */
  private static approximate_eigenvectors(
    matrix: number[][],
    count: number
  ): VectorTensor[] {
    const dim = matrix.length;
    const eigenvectors: VectorTensor[] = [];

    for (let k = 0; k < count; k++) {
      const v = new Float64Array(dim);
      for (let i = 0; i < dim; i++) {
        v[i] = Math.random();
      }

      for (let iter = 0; iter < 10; iter++) {
        const Av = new Float64Array(dim);
        for (let i = 0; i < dim; i++) {
          for (let j = 0; j < dim; j++) {
            Av[i] += matrix[i][j] * v[j];
          }
        }

        let norm = 0;
        for (let i = 0; i < dim; i++) {
          norm += Av[i] * Av[i];
        }
        norm = Math.sqrt(norm);

        for (let i = 0; i < dim; i++) {
          v[i] = Av[i] / norm;
        }
      }

      eigenvectors.push({ data: v, shape: [dim] });
    }

    return eigenvectors;
  }

  /**
   * Dot product
   */
  private static dot(v: VectorTensor, u: VectorTensor): number {
    let sum = 0;
    const limit = Math.min(v.data.length, u.data.length);
    for (let i = 0; i < limit; i++) {
      sum += v.data[i] * u.data[i];
    }
    return sum;
  }
}

// ============================================================================
// Visualizer
// ============================================================================

export class PostMindLangVisualizer {
  /**
   * Visualize vector space using PCA
   */
  static visualize_vector_space_pca(runtime: PostMindLangRuntime, queries: VectorTensor[]): Point2D[] {
    console.log('Generating PCA projection of vector space...');
    const points = DimensionReducer.pca_2d(queries);

    return points.map((p, i) => ({
      ...p,
      color: i < Math.floor(queries.length / 3) ? 'blue' : i < Math.floor((2 * queries.length) / 3) ? 'green' : 'red',
      size: 8,
    }));
  }

  /**
   * Visualize vector space using t-SNE
   */
  static visualize_vector_space_tsne(
    runtime: PostMindLangRuntime,
    queries: VectorTensor[]
  ): Point2D[] {
    console.log('Generating t-SNE projection of vector space...');
    const points = DimensionReducer.tsne_2d(queries, 30);

    return points.map((p, i) => ({
      ...p,
      color: Math.random() < 0.5 ? 'purple' : 'orange',
      size: 6,
      label: `query_${i}`,
    }));
  }

  /**
   * Visualize gradient flow through backward pass
   */
  static visualize_gradient_flow(backward_pass_data: {
    layer_outputs: VectorTensor[];
    layer_gradients: VectorTensor[];
  }): GradientFlowData[] {
    const flow_data: GradientFlowData[] = [];

    for (let layer = 0; layer < backward_pass_data.layer_gradients.length; layer++) {
      const grad = backward_pass_data.layer_gradients[layer];

      // Compute magnitude
      let magnitude = 0;
      for (let i = 0; i < Math.min(grad.data.length, 10); i++) {
        magnitude += grad.data[i] * grad.data[i];
      }
      magnitude = Math.sqrt(magnitude);

      // Compute direction (normalized)
      const direction: number[] = [];
      for (let i = 0; i < Math.min(grad.data.length, 3); i++) {
        direction.push(grad.data[i] / (magnitude + 1e-8));
      }

      flow_data.push({
        layer,
        gradient_magnitude: magnitude,
        gradient_direction: direction,
      });
    }

    return flow_data;
  }

  /**
   * Visualize weight evolution during training
   */
  static visualize_weight_evolution(training_history: {
    epochs: number;
    weights_per_epoch: number[][];
    ensemble_weights_per_epoch: number[][];
  }): WeightEvolution[] {
    const evolution: WeightEvolution[] = [];

    for (let epoch = 0; epoch < training_history.epochs; epoch++) {
      const weights = training_history.weights_per_epoch[epoch] || [];
      const path_contribs = training_history.ensemble_weights_per_epoch[epoch] || [0.33, 0.33, 0.34];

      evolution.push({
        epoch,
        weights_snapshot: weights.slice(0, 20),
        path_contributions: path_contribs,
      });
    }

    return evolution;
  }

  /**
   * Visualize ensemble decision making
   */
  static visualize_ensemble_decision(
    z_a: VectorTensor,
    z_b: VectorTensor,
    z_c: VectorTensor,
    ensemble_weights: number[]
  ): {
    path_vectors: Point2D[];
    ensemble_point: Point2D;
    weights: number[];
  } {
    const vectors = [z_a, z_b, z_c];
    const path_points = DimensionReducer.pca_2d(vectors);

    // Compute ensemble point as weighted combination
    const ensemble_x =
      ensemble_weights[0] * path_points[0].x +
      ensemble_weights[1] * path_points[1].x +
      ensemble_weights[2] * path_points[2].x;

    const ensemble_y =
      ensemble_weights[0] * path_points[0].y +
      ensemble_weights[1] * path_points[1].y +
      ensemble_weights[2] * path_points[2].y;

    return {
      path_vectors: path_points.map((p, i) => ({
        ...p,
        color: ['red', 'green', 'blue'][i],
        size: 12,
        label: `path_${i + 1}`,
      })),
      ensemble_point: {
        x: ensemble_x,
        y: ensemble_y,
        color: 'black',
        size: 16,
        label: 'ensemble',
      },
      weights: ensemble_weights,
    };
  }

  /**
   * Visualize transport map from paths to ensemble
   */
  static visualize_transport_map(
    z_a: VectorTensor,
    z_b: VectorTensor,
    z_c: VectorTensor,
    ensemble: VectorTensor,
    n_steps: number = 5
  ): {
    trajectories: Array<Point2D[]>;
    paths: Array<{ from: Point2D; to: Point2D }>;
  } {
    const start_vectors = [z_a, z_b, z_c];
    const start_points = DimensionReducer.pca_2d(start_vectors);
    const ensemble_point = DimensionReducer.pca_2d([ensemble])[0];

    const trajectories: Array<Point2D[]> = [];
    const paths: Array<{ from: Point2D; to: Point2D }> = [];

    for (let path_idx = 0; path_idx < 3; path_idx++) {
      const trajectory: Point2D[] = [];
      const start_pt = start_points[path_idx];

      for (let step = 0; step <= n_steps; step++) {
        const t = step / n_steps;
        trajectory.push({
          x: start_pt.x + t * (ensemble_point.x - start_pt.x),
          y: start_pt.y + t * (ensemble_point.y - start_pt.y),
          label: `path_${path_idx}_step_${step}`,
        });
      }

      trajectories.push(trajectory);
      paths.push({ from: start_pt, to: ensemble_point });
    }

    return { trajectories, paths };
  }

  /**
   * Generate ASCII visualization of vector space
   */
  static ascii_visualization_vector_space(points: Point2D[], width: number = 60, height: number = 20): string {
    const grid: string[][] = Array(height)
      .fill(0)
      .map(() => Array(width).fill(' '));

    // Scale and place points
    let min_x = Infinity,
      max_x = -Infinity;
    let min_y = Infinity,
      max_y = -Infinity;

    for (const p of points) {
      min_x = Math.min(min_x, p.x);
      max_x = Math.max(max_x, p.x);
      min_y = Math.min(min_y, p.y);
      max_y = Math.max(max_y, p.y);
    }

    const scale_x = (max_x - min_x) || 1;
    const scale_y = (max_y - min_y) || 1;

    for (const p of points) {
      const x = Math.floor(((p.x - min_x) / scale_x) * (width - 1));
      const y = Math.floor(((p.y - min_y) / scale_y) * (height - 1));

      if (x >= 0 && x < width && y >= 0 && y < height) {
        grid[y][x] = p.color === 'red' ? 'R' : p.color === 'green' ? 'G' : 'B';
      }
    }

    return grid.map((row) => row.join('')).join('\n');
  }

  /**
   * Generate ASCII visualization of gradient flow
   */
  static ascii_visualization_gradient_flow(flow_data: GradientFlowData[]): string {
    const lines: string[] = [];
    lines.push('Gradient Flow Through Layers:');
    lines.push('============================');

    for (const flow of flow_data) {
      const bar_width = Math.min(50, Math.floor(flow.gradient_magnitude * 100));
      const bar = '█'.repeat(bar_width);
      lines.push(
        `Layer ${flow.layer}: ${bar} (magnitude: ${flow.gradient_magnitude.toFixed(4)})`
      );
    }

    return lines.join('\n');
  }

  /**
   * Export visualization as JSON
   */
  static export_as_json(
    visualization_type: string,
    data: any
  ): string {
    return JSON.stringify(
      {
        type: visualization_type,
        timestamp: new Date().toISOString(),
        data,
      },
      null,
      2
    );
  }

  /**
   * Export visualization as SVG
   */
  static export_as_svg(
    points: Point2D[],
    width: number = 800,
    height: number = 600
  ): string {
    // Find bounds
    let min_x = Infinity,
      max_x = -Infinity;
    let min_y = Infinity,
      max_y = -Infinity;

    for (const p of points) {
      min_x = Math.min(min_x, p.x);
      max_x = Math.max(max_x, p.x);
      min_y = Math.min(min_y, p.y);
      max_y = Math.max(max_y, p.y);
    }

    const scale_x = (max_x - min_x) || 1;
    const scale_y = (max_y - min_y) || 1;
    const margin = 40;

    let svg = `<?xml version="1.0"?>\n`;
    svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>\n`;

    // Draw axes
    svg += `<line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>\n`;
    svg += `<line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" stroke="black" stroke-width="2"/>\n`;

    // Draw points
    for (const p of points) {
      const x = margin + ((p.x - min_x) / scale_x) * (width - 2 * margin);
      const y = height - margin - ((p.y - min_y) / scale_y) * (height - 2 * margin);
      const color = p.color || 'blue';
      const size = p.size || 5;

      svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" opacity="0.7"/>\n`;

      if (p.label) {
        svg += `<text x="${x + size + 3}" y="${y}" font-size="10" fill="black">${p.label}</text>\n`;
      }
    }

    svg += `</svg>\n`;
    return svg;
  }
}

export default PostMindLangVisualizer;
