// === Compatibility lookup table ===
const mbtiCompatibility = {
    'INTJ': ['ENFP', 'ENTP'],
    'INTP': ['ENTJ', 'ESTJ', 'ENFJ'],
    'ENTJ': ['INTP', 'INFP', 'ISFP'],
    'ENTP': ['INFJ', 'INTJ', 'ISFJ'],
    'INFJ': ['ENFP', 'ENTP'],
    'INFP': ['ENFJ', 'ENTJ', 'ESFJ'],
    'ENFJ': ['INFP', 'ISFP'],
    'ENFP': ['INFJ', 'INTJ'],
    'ISTJ': ['ESFP', 'ESTP'],
    'ISFJ': ['ESFP', 'ESTP'],
    'ESTJ': ['ISFP', 'ISTP'],
    'ESFJ': ['ISFP', 'ISTP'],
    'ISTP': ['ESFJ', 'ESTJ'],
    'ISFP': ['ENFJ', 'ESFJ', 'ESTJ'],
    'ESTP': ['ISFJ', 'ISTJ'],
    'ESFP': ['ISFJ', 'ISTJ'],
};

/**
 * Compute the most compatible MBTI type for a given MBTI
 * @param {string} mbti - The user's MBTI (e.g., "ENFP")
 * @returns {string|null} - The top compatible MBTI or null if not found
 */
export function getTopCompatibleMBTI(mbti) {
    const type = mbti?.toUpperCase();
    const compatibleList = mbtiCompatibility[type];
    return compatibleList ? compatibleList[0] : null;
}