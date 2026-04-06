/**
 * Curated list of NGSS Performance Expectations for the wizard's standards picker.
 * Covers most common HS and MS physical, life, and earth science PEs.
 */

export interface NgssStandard {
  code: string;
  title: string;
  gradeBand: 'MS' | 'HS';
  domain: 'PS' | 'LS' | 'ESS' | 'ETS';
  dci: string;
  sep: string;
  ccc: string;
}

export const NGSS_STANDARDS: NgssStandard[] = [
  // HS Physical Science
  { code: 'HS-PS1-1', title: 'Use the periodic table as a model to predict relative properties of elements', gradeBand: 'HS', domain: 'PS', dci: 'PS1.A', sep: 'Developing and Using Models', ccc: 'Patterns' },
  { code: 'HS-PS1-2', title: 'Construct and revise an explanation for the outcome of a simple chemical reaction', gradeBand: 'HS', domain: 'PS', dci: 'PS1.B', sep: 'Constructing Explanations', ccc: 'Energy and Matter' },
  { code: 'HS-PS1-3', title: 'Plan and conduct an investigation to gather evidence to compare the structure of substances', gradeBand: 'HS', domain: 'PS', dci: 'PS1.A', sep: 'Planning and Carrying Out Investigations', ccc: 'Structure and Function' },
  { code: 'HS-PS1-4', title: 'Develop a model to illustrate that the release or absorption of energy from a chemical reaction', gradeBand: 'HS', domain: 'PS', dci: 'PS1.B', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'HS-PS1-5', title: 'Apply scientific principles and evidence to provide an explanation about the effects of changing the temperature or concentration', gradeBand: 'HS', domain: 'PS', dci: 'PS1.B', sep: 'Constructing Explanations', ccc: 'Stability and Change' },
  { code: 'HS-PS1-6', title: 'Refine the design of a chemical system by specifying a change in conditions', gradeBand: 'HS', domain: 'PS', dci: 'PS1.B', sep: 'Constructing Explanations', ccc: 'Stability and Change' },
  { code: 'HS-PS1-7', title: 'Use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction', gradeBand: 'HS', domain: 'PS', dci: 'PS1.B', sep: 'Using Mathematics and Computational Thinking', ccc: 'Energy and Matter' },
  { code: 'HS-PS2-1', title: 'Analyze data to support the claim that Newton\'s second law describes the motion of macroscopic objects', gradeBand: 'HS', domain: 'PS', dci: 'PS2.A', sep: 'Analyzing and Interpreting Data', ccc: 'Cause and Effect' },
  { code: 'HS-PS2-2', title: 'Use mathematical representations to support the claim that the total momentum of a system of objects is conserved', gradeBand: 'HS', domain: 'PS', dci: 'PS2.A', sep: 'Using Mathematics and Computational Thinking', ccc: 'Systems and System Models' },
  { code: 'HS-PS2-3', title: 'Apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes the force on a macroscopic object', gradeBand: 'HS', domain: 'PS', dci: 'PS2.A', sep: 'Constructing Explanations', ccc: 'Cause and Effect' },
  { code: 'HS-PS2-4', title: 'Use mathematical representations of Newton\'s Law of Gravitation and Coulomb\'s Law to describe and predict the gravitational and electrostatic forces', gradeBand: 'HS', domain: 'PS', dci: 'PS2.B', sep: 'Using Mathematics and Computational Thinking', ccc: 'Patterns' },
  { code: 'HS-PS3-1', title: 'Create a computational model to calculate the change in the energy of one component in a system', gradeBand: 'HS', domain: 'PS', dci: 'PS3.A', sep: 'Using Mathematics and Computational Thinking', ccc: 'Energy and Matter' },
  { code: 'HS-PS3-2', title: 'Develop and use models to illustrate that energy at the macroscopic scale can be accounted for as a combination of energy associated with the motion of particles', gradeBand: 'HS', domain: 'PS', dci: 'PS3.A', sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity' },
  { code: 'HS-PS3-3', title: 'Design, build, and refine a device that works within given constraints to convert one form of energy into another', gradeBand: 'HS', domain: 'PS', dci: 'PS3.D', sep: 'Constructing Explanations', ccc: 'Energy and Matter' },
  { code: 'HS-PS4-1', title: 'Use mathematical representations to support a claim regarding relationships among the frequency, wavelength, and speed of waves', gradeBand: 'HS', domain: 'PS', dci: 'PS4.A', sep: 'Using Mathematics and Computational Thinking', ccc: 'Patterns' },
  { code: 'HS-PS4-4', title: 'Evaluate the validity and reliability of claims in published materials about the effects that different frequencies of electromagnetic radiation have', gradeBand: 'HS', domain: 'PS', dci: 'PS4.B', sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Cause and Effect' },
  // HS Life Science
  { code: 'HS-LS1-1', title: 'Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins', gradeBand: 'HS', domain: 'LS', dci: 'LS1.A', sep: 'Constructing Explanations', ccc: 'Structure and Function' },
  { code: 'HS-LS1-2', title: 'Develop and use a model to illustrate the hierarchical organization of interacting systems', gradeBand: 'HS', domain: 'LS', dci: 'LS1.A', sep: 'Developing and Using Models', ccc: 'Systems and System Models' },
  { code: 'HS-LS1-3', title: 'Plan and conduct an investigation to provide evidence that feedback mechanisms maintain homeostasis', gradeBand: 'HS', domain: 'LS', dci: 'LS1.A', sep: 'Planning and Carrying Out Investigations', ccc: 'Stability and Change' },
  { code: 'HS-LS1-4', title: 'Use a model to illustrate the role of cellular division and differentiation in producing and maintaining complex organisms', gradeBand: 'HS', domain: 'LS', dci: 'LS1.B', sep: 'Developing and Using Models', ccc: 'Growth, Development, and Reproduction of Organisms' },
  { code: 'HS-LS1-5', title: 'Use a model to illustrate how photosynthesis transforms light energy into stored chemical energy', gradeBand: 'HS', domain: 'LS', dci: 'LS1.C', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'HS-LS1-6', title: 'Construct and revise an explanation based on evidence for how carbon, hydrogen, and oxygen from sugar molecules may combine with other elements', gradeBand: 'HS', domain: 'LS', dci: 'LS1.C', sep: 'Constructing Explanations', ccc: 'Energy and Matter' },
  { code: 'HS-LS2-1', title: 'Use mathematical and/or computational representations to support explanations of factors that affect carrying capacity', gradeBand: 'HS', domain: 'LS', dci: 'LS2.A', sep: 'Using Mathematics and Computational Thinking', ccc: 'Cause and Effect' },
  { code: 'HS-LS2-4', title: 'Use mathematical representations to support claims for the cycling of matter and flow of energy among organisms in an ecosystem', gradeBand: 'HS', domain: 'LS', dci: 'LS2.B', sep: 'Using Mathematics and Computational Thinking', ccc: 'Energy and Matter' },
  { code: 'HS-LS3-1', title: 'Ask questions to clarify relationships about the role of DNA and chromosomes in coding the instructions for characteristic traits', gradeBand: 'HS', domain: 'LS', dci: 'LS3.A', sep: 'Asking Questions and Defining Problems', ccc: 'Structure and Function' },
  { code: 'HS-LS4-1', title: 'Communicate scientific information that common ancestry and biological evolution are supported by multiple lines of empirical evidence', gradeBand: 'HS', domain: 'LS', dci: 'LS4.A', sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Patterns' },
  { code: 'HS-LS4-2', title: 'Construct an explanation based on evidence that the process of evolution primarily results from natural selection', gradeBand: 'HS', domain: 'LS', dci: 'LS4.B', sep: 'Constructing Explanations', ccc: 'Cause and Effect' },
  // HS Earth Science
  { code: 'HS-ESS1-1', title: 'Develop a model based on evidence to illustrate the life span of the sun and the role of nuclear fusion', gradeBand: 'HS', domain: 'ESS', dci: 'ESS1.A', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'HS-ESS1-4', title: 'Use mathematical or computational representations to predict the motion of orbiting objects in the solar system', gradeBand: 'HS', domain: 'ESS', dci: 'ESS1.B', sep: 'Using Mathematics and Computational Thinking', ccc: 'Scale, Proportion, and Quantity' },
  { code: 'HS-ESS2-2', title: 'Analyze geoscience data to make the claim that one change to Earth\'s surface can create feedbacks', gradeBand: 'HS', domain: 'ESS', dci: 'ESS2.A', sep: 'Analyzing and Interpreting Data', ccc: 'Stability and Change' },
  { code: 'HS-ESS2-4', title: 'Use a model to describe how variations in the flow of energy into and out of Earth\'s systems result in changes in climate', gradeBand: 'HS', domain: 'ESS', dci: 'ESS2.D', sep: 'Developing and Using Models', ccc: 'Cause and Effect' },
  { code: 'HS-ESS3-1', title: 'Construct an explanation based on evidence for how the availability of natural resources has influenced human activity', gradeBand: 'HS', domain: 'ESS', dci: 'ESS3.A', sep: 'Constructing Explanations', ccc: 'Cause and Effect' },
  { code: 'HS-ESS3-6', title: 'Use a computational representation to illustrate the relationships among Earth systems and how those relationships are being modified due to human activity', gradeBand: 'HS', domain: 'ESS', dci: 'ESS3.D', sep: 'Using Mathematics and Computational Thinking', ccc: 'Stability and Change' },
  // MS Physical Science
  { code: 'MS-PS1-1', title: 'Develop models to describe the atomic composition of simple molecules and extended structures', gradeBand: 'MS', domain: 'PS', dci: 'PS1.A', sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity' },
  { code: 'MS-PS1-2', title: 'Analyze and interpret data on the properties of substances before and after the substances interact', gradeBand: 'MS', domain: 'PS', dci: 'PS1.B', sep: 'Analyzing and Interpreting Data', ccc: 'Patterns' },
  { code: 'MS-PS1-5', title: 'Develop and use a model to describe how the total number of atoms does not change in a chemical reaction', gradeBand: 'MS', domain: 'PS', dci: 'PS1.B', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'MS-PS2-1', title: 'Apply Newton\'s Third Law to design a solution to a problem involving the motion of two colliding objects', gradeBand: 'MS', domain: 'PS', dci: 'PS2.A', sep: 'Constructing Explanations', ccc: 'Systems and System Models' },
  { code: 'MS-PS3-1', title: 'Construct and interpret graphical displays of data to describe the relationships of kinetic energy to the mass of an object and to the speed of an object', gradeBand: 'MS', domain: 'PS', dci: 'PS3.A', sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity' },
  // MS Life Science
  { code: 'MS-LS1-1', title: 'Conduct an investigation to provide evidence that living things are made of cells', gradeBand: 'MS', domain: 'LS', dci: 'LS1.A', sep: 'Planning and Carrying Out Investigations', ccc: 'Scale, Proportion, and Quantity' },
  { code: 'MS-LS1-6', title: 'Construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and flow of energy into and out of organisms', gradeBand: 'MS', domain: 'LS', dci: 'LS1.C', sep: 'Constructing Explanations', ccc: 'Energy and Matter' },
  { code: 'MS-LS2-3', title: 'Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem', gradeBand: 'MS', domain: 'LS', dci: 'LS2.B', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'MS-LS3-1', title: 'Develop and use a model to describe why structural changes to genes located on chromosomes may affect proteins', gradeBand: 'MS', domain: 'LS', dci: 'LS3.A', sep: 'Developing and Using Models', ccc: 'Structure and Function' },
  { code: 'MS-LS4-4', title: 'Construct an explanation based on evidence that describes how genetic variations of traits in a population increase some individuals\' probability of surviving', gradeBand: 'MS', domain: 'LS', dci: 'LS4.B', sep: 'Constructing Explanations', ccc: 'Cause and Effect' },
  // MS Earth Science
  { code: 'MS-ESS1-1', title: 'Develop and use a model of the Earth-sun-moon system to describe the cyclic patterns of lunar phases', gradeBand: 'MS', domain: 'ESS', dci: 'ESS1.A', sep: 'Developing and Using Models', ccc: 'Patterns' },
  { code: 'MS-ESS2-1', title: 'Develop a model to describe the cycling of Earth\'s materials and the flow of energy that drives this process', gradeBand: 'MS', domain: 'ESS', dci: 'ESS2.A', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'MS-ESS2-4', title: 'Develop a model to describe the cycling of water through Earth\'s systems driven by energy from the sun and the force of gravity', gradeBand: 'MS', domain: 'ESS', dci: 'ESS2.C', sep: 'Developing and Using Models', ccc: 'Energy and Matter' },
  { code: 'MS-ESS3-3', title: 'Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment', gradeBand: 'MS', domain: 'ESS', dci: 'ESS3.C', sep: 'Constructing Explanations', ccc: 'Cause and Effect' },
];
