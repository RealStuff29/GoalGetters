export function useComputeMBTI() {
    function computeMbtiType(answers, questions) {
        const score = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

        answers.forEach((a, i) => {
            const q = questions[i]
            if (!q) return
            if (a === "POS") score[q.pos] += 1
            else if (a === "NEG") score[q.neg] += 1
            // skip NEUTRAL
        })

        const EI = score.E >= score.I ? "E" : "I"
        const SN = score.S >= score.N ? "S" : "N"
        const TF = score.T >= score.F ? "T" : "F"
        const JP = score.J >= score.P ? "J" : "P"

        const result = `${EI}${SN}${TF}${JP}`
        console.log("Computed MBTI:", result) // Debug log
        return result
    }

    return { computeMbtiType }
}
