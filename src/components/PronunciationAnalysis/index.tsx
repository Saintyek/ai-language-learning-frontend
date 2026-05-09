/**
 * 发音分析组件
 * Feature: 20260508-voice-interaction-feature
 *
 * 展示发音质量分析结果，包括评分、问题音素高亮和改进建议
 */

import React from 'react'
import { Card, Typography, Progress, Tag, Space } from '@douyinfe/semi-ui'
import { IconLikeHeart, IconAlertTriangle, IconStar } from '@douyinfe/semi-icons'
import type { PronunciationResult, PronunciationProblem } from '../../types/voice'
import './styles.css'

export interface PronunciationAnalysisProps {
  /** 发音分析结果 */
  result: PronunciationResult
  /** 自定义类名 */
  className?: string
}

/**
 * 获取评分颜色
 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'var(--semi-color-success)'
  if (score >= 60) return 'var(--semi-color-warning)'
  return 'var(--semi-color-danger)'
}

/**
 * 获取评分等级
 */
const getScoreLevel = (score: number): string => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '及格'
  return '需要加强'
}

/**
 * 问题音素高亮展示
 */
const ProblemHighlight: React.FC<{ problems: PronunciationProblem[] }> = ({ problems }) => {
  if (!problems || problems.length === 0) {
    return (
      <div className="pronunciation-analysis__no-problems">
        <IconLikeHeart style={{ color: 'var(--semi-color-success)', marginRight: 8 }} />
        <Typography.Text type="success">发音非常标准！</Typography.Text>
      </div>
    )
  }

  return (
    <div className="pronunciation-analysis__problems">
      <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
        问题音素：
      </Typography.Text>
      <Space wrap>
        {problems.map((problem, index) => (
          <Tag
            key={index}
            color={problem.type === 'missing' ? 'amber' : problem.type === 'wrong' ? 'red' : 'cyan'}
            size="large"
          >
            <span className="pronunciation-analysis__problem-tag">
              <span className="pronunciation-analysis__expected">{problem.expected}</span>
              {problem.type === 'wrong' && (
                <>
                  <span className="pronunciation-analysis__arrow">→</span>
                  <span className="pronunciation-analysis__actual">{problem.actual}</span>
                </>
              )}
              {problem.type === 'missing' && (
                <span className="pronunciation-analysis__missing-label">漏读</span>
              )}
              {problem.type === 'extra' && (
                <span className="pronunciation-analysis__extra-label">多余</span>
              )}
            </span>
          </Tag>
        ))}
      </Space>
    </div>
  )
}

/**
 * 发音分析组件
 */
export const PronunciationAnalysis: React.FC<PronunciationAnalysisProps> = ({
  result,
  className,
}) => {
  const { score, problems, suggestion } = result
  const scoreColor = getScoreColor(score)

  return (
    <Card
      className={`pronunciation-analysis ${className ?? ''}`}
      title={
        <div className="pronunciation-analysis__header">
          <IconStar style={{ color: scoreColor, marginRight: 8 }} />
          <span>发音分析</span>
        </div>
      }
      headerExtraContent={
        <Tag size="large" style={{ backgroundColor: scoreColor, color: 'white' }}>
          {getScoreLevel(score)}
        </Tag>
      }
    >
      {/* 评分展示 */}
      <div className="pronunciation-analysis__score-section">
        <Progress
          percent={score}
          stroke={scoreColor}
          strokeWidth={12}
          showInfo
          style={{ marginBottom: 16 }}
        />
        <Typography.Title heading={4} style={{ textAlign: 'center', color: scoreColor }}>
          {score} 分
        </Typography.Title>
      </div>

      {/* 问题音素高亮 */}
      <ProblemHighlight problems={problems} />

      {/* 改进建议 */}
      {suggestion && (
        <div className="pronunciation-analysis__suggestion">
          <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
            <IconAlertTriangle style={{ color: 'var(--semi-color-warning)', marginRight: 8 }} />
            改进建议：
          </Typography.Text>
          <Typography.Text type="tertiary">{suggestion}</Typography.Text>
        </div>
      )}
    </Card>
  )
}

export default PronunciationAnalysis
