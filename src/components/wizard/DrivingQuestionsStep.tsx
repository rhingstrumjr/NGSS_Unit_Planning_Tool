'use client';

interface DrivingQuestionsStepProps {
  unitDrivingQuestion: string;
  subQuestions: string[];
  onUnitDQChange: (v: string) => void;
  onSubQuestionsChange: (qs: string[]) => void;
}

export function DrivingQuestionsStep({
  unitDrivingQuestion,
  subQuestions,
  onUnitDQChange,
  onSubQuestionsChange,
}: DrivingQuestionsStepProps) {
  function updateSubQ(i: number, val: string) {
    onSubQuestionsChange(subQuestions.map((q, idx) => (idx === i ? val : q)));
  }

  function addSubQ() {
    onSubQuestionsChange([...subQuestions, '']);
  }

  function removeSubQ(i: number) {
    onSubQuestionsChange(subQuestions.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Driving Questions</h1>
      <p className="text-muted mb-8">
        The unit driving question anchors the whole storyline. Sub-questions predict what students will
        wonder — each one can drive a sensemaking loop.
      </p>

      {/* Unit DQ */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-foreground mb-2">
          Unit Driving Question
          <span className="text-muted font-normal ml-2 text-xs">(the overarching question tied to the phenomenon)</span>
        </label>
        <textarea
          value={unitDrivingQuestion}
          onChange={(e) => onUnitDQChange(e.target.value)}
          placeholder="e.g. How do airbags save lives during a crash?"
          rows={2}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50 resize-none"
        />
      </div>

      {/* Sub-questions */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">
          Predicted Student Sub-Questions
        </label>
        <p className="text-xs text-muted mb-4">
          These are questions students might naturally ask. Each one can drive a sensemaking loop.
        </p>

        <div className="space-y-2">
          {subQuestions.map((q, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-muted text-sm font-mono mt-2.5 w-5 shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={q}
                onChange={(e) => updateSubQ(i, e.target.value)}
                placeholder={`Student question ${i + 1}...`}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-teal/50"
              />
              <button
                onClick={() => removeSubQ(i)}
                className="mt-2 text-muted hover:text-red transition-colors text-sm shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addSubQ}
          className="mt-3 flex items-center gap-2 text-sm text-teal-light hover:text-teal transition-colors"
        >
          <span className="text-lg font-bold">+</span> Add sub-question
        </button>
      </div>

      <div className="mt-8 p-4 bg-surface-light rounded-lg border border-border">
        <p className="text-muted text-sm">
          <span className="text-teal-light font-medium">Tip:</span> Don't worry about getting these
          perfect now. In the builder you can edit them, add more, and link each question to the
          specific loop that will address it.
        </p>
      </div>
    </div>
  );
}
