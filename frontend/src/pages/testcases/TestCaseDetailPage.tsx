import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { TestCaseResponse, TestCaseStatus, TestCasePriority, TestCaseType } from '../types/testCase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface TestCaseDetailPageProps {
  projectId: number;
  testCase?: TestCaseResponse;
  onSave: (data: any) => void;
  onCancel: () => void;
}

// 表单验证schema
const testCaseSchema = yup.object({
  title: yup.string().required('标题不能为空'),
  description: yup.string(),
  status: yup.mixed<TestCaseStatus>().required('状态不能为空'),
  priority: yup.mixed<TestCasePriority>().required('优先级不能为空'),
  type: yup.mixed<TestCaseType>().required('类型不能为空'),
  preconditions: yup.string(),
  estimated_duration: yup.number().min(0).nullable(),
  tags: yup.array().of(yup.string()),
}).required();

const TestCaseDetailPage: React.FC<TestCaseDetailPageProps> = ({
  projectId,
  testCase,
  onSave,
  onCancel,
}) => {
  const [steps, setSteps] = useState<string[]>(testCase?.steps || ['', '']);
  const [expectedResults, setExpectedResults] = useState<string[]>(testCase?.expected_results || ['', '']);
  const [tags, setTags] = useState<string[]>(testCase?.tags || []);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: yupResolver(testCaseSchema),
    defaultValues: {
      title: testCase?.title || '',
      description: testCase?.description || '',
      status: testCase?.status || TestCaseStatus.DRAFT,
      priority: testCase?.priority || TestCasePriority.MEDIUM,
      type: testCase?.type || TestCaseType.FUNCTIONAL,
      preconditions: testCase?.preconditions || '',
      estimated_duration: testCase?.estimated_duration || null,
      tags: testCase?.tags || [],
    },
  });

  const watchedTags = watch('tags');

  useEffect(() => {
    setTags(watchedTags || []);
  }, [watchedTags]);

  // 添加步骤
  const addStep = () => {
    setSteps([...steps, '']);
  };

  // 更新步骤
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
    setValue('steps', newSteps);
  };

  // 删除步骤
  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setValue('steps', newSteps);
  };

  // 添加预期结果
  const addExpectedResult = () => {
    setExpectedResults([...expectedResults, '']);
  };

  // 更新预期结果
  const updateExpectedResult = (index: number, value: string) => {
    const newExpectedResults = [...expectedResults];
    newExpectedResults[index] = value;
    setExpectedResults(newExpectedResults);
    setValue('expected_results', newExpectedResults);
  };

  // 删除预期结果
  const removeExpectedResult = (index: number) => {
    if (expectedResults.length <= 1) return;
    const newExpectedResults = expectedResults.filter((_, i) => i !== index);
    setExpectedResults(newExpectedResults);
    setValue('expected_results', newExpectedResults);
  };

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setNewTag('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  // 处理表单提交
  const onSubmit = (data: any) => {
    const formData = {
      ...data,
      steps: steps.filter(step => step.trim() !== ''),
      expected_results: expectedResults.filter(result => result.trim() !== ''),
      tags: tags.filter(tag => tag.trim() !== ''),
    };
    onSave(formData);
  };

  // 状态选项
  const statusOptions = [
    { value: TestCaseStatus.DRAFT, label: '草稿' },
    { value: TestCaseStatus.ACTIVE, label: '激活' },
    { value: TestCaseStatus.BLOCKED, label: '阻塞' },
    { value: TestCaseStatus.DEPRECATED, label: '废弃' },
  ];

  // 优先级选项
  const priorityOptions = [
    { value: TestCasePriority.LOW, label: '低' },
    { value: TestCasePriority.MEDIUM, label: '中' },
    { value: TestCasePriority.HIGH, label: '高' },
    { value: TestCasePriority.CRITICAL, label: '紧急' },
  ];

  // 类型选项
  const typeOptions = [
    { value: TestCaseType.FUNCTIONAL, label: '功能' },
    { value: TestCaseType.PERFORMANCE, label: '性能' },
    { value: TestCaseType.SECURITY, label: '安全' },
    { value: TestCaseType.REGRESSION, label: '回归' },
    { value: TestCaseType.MANUAL, label: '手动' },
    { value: TestCaseType.AUTOMATED, label: '自动化' },
  ];

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {testCase ? '编辑测试用例' : '创建测试用例'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="标题"
            {...register('title')}
            error={errors.title?.message}
          />
          
          <Select
            label="状态"
            {...register('status')}
            options={statusOptions}
            error={errors.status?.message}
          />
          
          <Select
            label="优先级"
            {...register('priority')}
            options={priorityOptions}
            error={errors.priority?.message}
          />
          
          <Select
            label="类型"
            {...register('type')}
            options={typeOptions}
            error={errors.type?.message}
          />
          
          <Input
            label="预估时长（分钟）"
            type="number"
            {...register('estimated_duration', { valueAsNumber: true })}
            error={errors.estimated_duration?.message}
          />
        </div>
        
        <div>
          <Input
            label="描述"
            {...register('description')}
            error={errors.description?.message}
            multiline
            rows={3}
          />
        </div>
        
        <div>
          <Input
            label="前置条件"
            {...register('preconditions')}
            error={errors.preconditions?.message}
            multiline
            rows={2}
          />
        </div>
      </div>

      {/* 测试步骤 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">测试步骤</h3>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                {index + 1}
              </div>
              <Input
                placeholder={`步骤 ${index + 1}`}
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="flex-1"
              />
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addStep}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>添加步骤</span>
        </Button>
      </div>

      {/* 预期结果 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">预期结果</h3>
        <div className="space-y-3">
          {expectedResults.map((result, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                {index + 1}
              </div>
              <Input
                placeholder={`预期结果 ${index + 1}`}
                value={result}
                onChange={(e) => updateExpectedResult(index, e.target.value)}
                className="flex-1"
              />
              {expectedResults.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExpectedResult(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addExpectedResult}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>添加预期结果</span>
        </Button>
      </div>

      {/* 标签 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">标签</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              closable
              onClose={() => removeTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="添加标签"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!newTag.trim() || tags.includes(newTag.trim())}
          >
            添加
          </Button>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
};

export default TestCaseDetailPage;