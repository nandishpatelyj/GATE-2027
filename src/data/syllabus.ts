import { SubjectId, SubjectMeta, SyllabusTopic, ImportanceLevel } from '../types';

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'prob_stats',
    name: 'Probability & Statistics',
    shortName: 'Prob & Stats',
    expectedMarks: 16,
    phaseNumber: 1,
    accentHex: '#14b8a6',
  },
  {
    id: 'linear_algebra',
    name: 'Linear Algebra',
    shortName: 'Linear Alg',
    expectedMarks: 10,
    phaseNumber: 1,
    accentHex: '#0ea5e9',
  },
  {
    id: 'calculus_opt',
    name: 'Calculus & Optimization',
    shortName: 'Calculus & Opt',
    expectedMarks: 8,
    phaseNumber: 1,
    accentHex: '#3b82f6',
  },
  {
    id: 'prog_dsa',
    name: 'Programming, Data Structures & Algorithms',
    shortName: 'Prog & DSA',
    expectedMarks: 15,
    phaseNumber: 2,
    accentHex: '#f59e0b',
  },
  {
    id: 'dbms_warehouse',
    name: 'Database Management & Warehousing',
    shortName: 'DBMS & DW',
    expectedMarks: 8,
    phaseNumber: 2,
    accentHex: '#eab308',
  },
  {
    id: 'machine_learning',
    name: 'Machine Learning',
    shortName: 'Machine Learning',
    expectedMarks: 17,
    phaseNumber: 3,
    accentHex: '#10b981',
  },
  {
    id: 'artificial_intelligence',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    expectedMarks: 11,
    phaseNumber: 4,
    accentHex: '#06b6d4',
  },
  {
    id: 'general_aptitude',
    name: 'General Aptitude',
    shortName: 'Gen Aptitude',
    expectedMarks: 15,
    phaseNumber: 1,
    accentHex: '#64748b',
  },
];

export const SUBJECT_MAP: Record<SubjectId, SubjectMeta> = SUBJECTS.reduce(
  (acc, subj) => {
    acc[subj.id] = subj;
    return acc;
  },
  {} as Record<SubjectId, SubjectMeta>
);

function makeTopic(
  id: string,
  subjectId: SubjectId,
  title: string,
  importance: ImportanceLevel = 'High'
): SyllabusTopic {
  return {
    id,
    subjectId,
    title,
    status: 'not_started',
    importance,
    videoUrl: '',
    notesUrl: '',
  };
}

export const INITIAL_SYLLABUS_TOPICS: SyllabusTopic[] = [
  // 1. Probability & Statistics
  makeTopic('ps_01', 'prob_stats', 'Counting (Permutations & Combinations)', 'Medium'),
  makeTopic('ps_02', 'prob_stats', 'Probability Axioms, Sample Space & Events', 'High'),
  makeTopic('ps_03', 'prob_stats', 'Independent & Mutually Exclusive Events', 'Medium'),
  makeTopic('ps_04', 'prob_stats', 'Marginal, Conditional & Joint Probability', 'High'),
  makeTopic('ps_05', 'prob_stats', 'Bayes Theorem & Applications', 'High'),
  makeTopic('ps_06', 'prob_stats', 'Conditional Expectation & Variance, Mean, Median, Mode & Standard Deviation', 'High'),
  makeTopic('ps_07', 'prob_stats', 'Correlation & Covariance', 'High'),
  makeTopic('ps_08', 'prob_stats', 'Discrete Distributions: Uniform, Bernoulli, Binomial & Poisson', 'High'),
  makeTopic('ps_09', 'prob_stats', 'Continuous Distributions: Uniform, Exponential, Normal, Standard Normal, t & Chi-squared', 'High'),
  makeTopic('ps_10', 'prob_stats', 'Cumulative Distribution Functions & Conditional PDF', 'Medium'),
  makeTopic('ps_11', 'prob_stats', 'Central Limit Theorem (CLT)', 'High'),
  makeTopic('ps_12', 'prob_stats', 'Confidence Intervals', 'Medium'),
  makeTopic('ps_13', 'prob_stats', 'Hypothesis Testing: z-test, t-test & Chi-squared test', 'High'),

  // 2. Linear Algebra
  makeTopic('la_01', 'linear_algebra', 'Vector Spaces & Subspaces', 'High'),
  makeTopic('la_02', 'linear_algebra', 'Linear Dependence & Independence of Vectors', 'High'),
  makeTopic('la_03', 'linear_algebra', 'Matrices, Rank & Nullity (Rank-Nullity Theorem)', 'High'),
  makeTopic('la_04', 'linear_algebra', 'Systems of Linear Equations (Consistency & Solutions)', 'High'),
  makeTopic('la_05', 'linear_algebra', 'Gaussian Elimination', 'Medium'),
  makeTopic('la_06', 'linear_algebra', 'Determinants & Properties (Idempotent, Partitioned, Inverse)', 'Medium'),
  makeTopic('la_07', 'linear_algebra', 'Eigenvalues & Eigenvectors', 'High'),
  makeTopic('la_08', 'linear_algebra', 'Projection Matrices & Orthogonal Projections', 'High'),
  makeTopic('la_09', 'linear_algebra', 'Orthogonal Matrices', 'Medium'),
  makeTopic('la_10', 'linear_algebra', 'Quadratic Forms & Definiteness', 'High'),
  makeTopic('la_11', 'linear_algebra', 'LU Decomposition', 'Medium'),
  makeTopic('la_12', 'linear_algebra', 'Singular Value Decomposition (SVD)', 'High'),

  // 3. Calculus & Optimization
  makeTopic('co_01', 'calculus_opt', 'Functions of a Single Variable & Limits', 'High'),
  makeTopic('co_02', 'calculus_opt', 'Continuity', 'Medium'),
  makeTopic('co_03', 'calculus_opt', 'Differentiability & Mean Value Theorems', 'High'),
  makeTopic('co_04', 'calculus_opt', 'Taylor Series & Approximations', 'High'),
  makeTopic('co_05', 'calculus_opt', 'Maxima & Minima (Single-Variable Optimization)', 'High'),

  // 4. Programming, Data Structures & Algorithms
  makeTopic('dsa_01', 'prog_dsa', 'Programming in Python (Control Flow, Recursion, Scoping, Comprehensions)', 'High'),
  makeTopic('dsa_02', 'prog_dsa', 'Stacks & Applications', 'High'),
  makeTopic('dsa_03', 'prog_dsa', 'Queues & Priority Queues', 'High'),
  makeTopic('dsa_04', 'prog_dsa', 'Linked Lists (Singly, Doubly, Circular)', 'Medium'),
  makeTopic('dsa_05', 'prog_dsa', 'Trees, Binary Trees, BST & Heaps', 'High'),
  makeTopic('dsa_06', 'prog_dsa', 'Hash Tables & Collision Resolution', 'High'),
  makeTopic('dsa_07', 'prog_dsa', 'Search Algorithms: Linear Search & Binary Search', 'Medium'),
  makeTopic('dsa_08', 'prog_dsa', 'Basic Sorting: Selection, Bubble & Insertion Sort', 'Medium'),
  makeTopic('dsa_09', 'prog_dsa', 'Divide & Conquer Sorting: Mergesort & Quicksort', 'High'),
  makeTopic('dsa_10', 'prog_dsa', 'Introduction to Graph Theory & Basic Graph Concepts', 'Medium'),
  makeTopic('dsa_11', 'prog_dsa', 'Graph Traversals: Breadth-First Search (BFS) & Depth-First Search (DFS)', 'High'),
  makeTopic('dsa_12', 'prog_dsa', 'Shortest Path Algorithms (Dijkstra, Bellman-Ford, DAG)', 'High'),

  // 5. Database Management & Warehousing
  makeTopic('db_01', 'dbms_warehouse', 'ER-Model & ER-to-Relational Mapping', 'Medium'),
  makeTopic('db_02', 'dbms_warehouse', 'Relational Model & Integrity Constraints', 'High'),
  makeTopic('db_03', 'dbms_warehouse', 'Relational Algebra', 'High'),
  makeTopic('db_04', 'dbms_warehouse', 'Tuple Relational Calculus', 'Medium'),
  makeTopic('db_05', 'dbms_warehouse', 'SQL Queries, Joins, Nested Queries & Aggregation', 'High'),
  makeTopic('db_06', 'dbms_warehouse', 'Functional Dependencies & Normal Forms (1NF, 2NF, 3NF, BCNF)', 'High'),
  makeTopic('db_07', 'dbms_warehouse', 'File Organization & Indexing (B-Trees & B+ Trees)', 'Medium'),
  makeTopic('db_08', 'dbms_warehouse', 'Data Transformation: Normalization, Discretization, Sampling & Compression', 'Medium'),
  makeTopic('db_09', 'dbms_warehouse', 'Data Warehouse Modelling: Multidimensional Schemas (Star, Snowflake, Fact Constellation)', 'Medium'),
  makeTopic('db_10', 'dbms_warehouse', 'Concept Hierarchies', 'Low'),
  makeTopic('db_11', 'dbms_warehouse', 'Categorization & Computations of Measures', 'Low'),

  // 6. Machine Learning
  makeTopic('ml_01', 'machine_learning', 'Regression: Simple Linear, Multiple Linear & Ridge Regression', 'High'),
  makeTopic('ml_02', 'machine_learning', 'Logistic Regression', 'High'),
  makeTopic('ml_03', 'machine_learning', 'k-Nearest Neighbour (kNN)', 'Medium'),
  makeTopic('ml_04', 'machine_learning', 'Naive Bayes Classifier', 'High'),
  makeTopic('ml_05', 'machine_learning', 'Linear Discriminant Analysis (LDA)', 'Medium'),
  makeTopic('ml_06', 'machine_learning', 'Support Vector Machine (SVM) & Kernels', 'High'),
  makeTopic('ml_07', 'machine_learning', 'Decision Trees (Entropy, Gini, Information Gain)', 'High'),
  makeTopic('ml_08', 'machine_learning', 'Bias-Variance Trade-Off', 'High'),
  makeTopic('ml_09', 'machine_learning', 'Cross-Validation Methods: Leave-One-Out (LOO) & k-Folds', 'High'),
  makeTopic('ml_10', 'machine_learning', 'Multi-Layer Perceptron (MLP)', 'High'),
  makeTopic('ml_11', 'machine_learning', 'Feed-Forward Neural Networks & Backpropagation Basics', 'High'),
  makeTopic('ml_12', 'machine_learning', 'Clustering: k-Means & k-Medoid', 'High'),
  makeTopic('ml_13', 'machine_learning', 'Hierarchical Clustering (Single, Complete, Average Linkage)', 'Medium'),
  makeTopic('ml_14', 'machine_learning', 'Dimensionality Reduction: Principal Component Analysis (PCA)', 'High'),

  // 7. Artificial Intelligence
  makeTopic('ai_01', 'artificial_intelligence', 'Uninformed Search (BFS, DFS, Uniform Cost, Iterative Deepening)', 'High'),
  makeTopic('ai_02', 'artificial_intelligence', 'Informed Search (Greedy Best-First, A* Search & Admissibility)', 'High'),
  makeTopic('ai_03', 'artificial_intelligence', 'Adversarial Search (Minimax & Alpha-Beta Pruning)', 'High'),
  makeTopic('ai_04', 'artificial_intelligence', 'Propositional Logic (Syntax, Semantics, Resolution, Inference)', 'High'),
  makeTopic('ai_05', 'artificial_intelligence', 'Predicate Logic (First-Order Logic, Quantifiers, Unification)', 'High'),
  makeTopic('ai_06', 'artificial_intelligence', 'Reasoning Under Uncertainty: Conditional Independence Representation (Bayesian Networks / D-Separation)', 'High'),
  makeTopic('ai_07', 'artificial_intelligence', 'Exact Inference Through Variable Elimination', 'High'),
  makeTopic('ai_08', 'artificial_intelligence', 'Approximate Inference Through Sampling (Prior, Rejection, Likelihood Weighting, Gibbs)', 'Medium'),

  // 8. General Aptitude
  makeTopic('ga_01', 'general_aptitude', 'Verbal Aptitude (Grammar, Vocabulary, Reading Comprehension)', 'Medium'),
  makeTopic('ga_02', 'general_aptitude', 'Quantitative Aptitude (Data Interpretation, Ratios, Percentages, Mensuration, Elementary Combinatorics)', 'High'),
  makeTopic('ga_03', 'general_aptitude', 'Analytical & Spatial Aptitude (Logic Deduction, Series, Folding/Rotation)', 'High'),
];
