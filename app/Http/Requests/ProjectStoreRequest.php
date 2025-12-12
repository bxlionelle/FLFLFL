<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProjectStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admins and project managers can create projects
        $user = $this->user();
        $userRole = $user?->roles->first()?->name;
        
        return in_array(strtolower($userRole), ['administrator', 'project_manager']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,on_hold,completed,at_risk,cancelled',
            'progress' => 'nullable|integer|min:0|max:100',
            'manager_id' => 'required|exists:users,id',
            'client_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'team_members' => 'nullable|array',
            'team_members.*' => 'exists:users,id',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'project name',
            'manager_id' => 'project manager',
            'client_id' => 'client',
            'start_date' => 'start date',
            'end_date' => 'end date',
            'due_date' => 'due date',
            'team_members' => 'team members',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The project name is required.',
            'manager_id.required' => 'A project manager must be assigned.',
            'manager_id.exists' => 'The selected project manager does not exist.',
            'client_id.exists' => 'The selected client does not exist.',
            'start_date.required' => 'The project start date is required.',
            'end_date.after_or_equal' => 'The end date must be after or equal to the start date.',
            'due_date.after_or_equal' => 'The due date must be after or equal to the start date.',
            'progress.min' => 'Progress cannot be less than 0%.',
            'progress.max' => 'Progress cannot be greater than 100%.',
            'team_members.*.exists' => 'One or more selected team members do not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set created_by to the authenticated user
        $this->merge([
            'created_by' => $this->user()->id,
        ]);

        // Set default status if not provided
        if (!$this->has('status')) {
            $this->merge([
                'status' => 'active',
            ]);
        }

        // Set default progress if not provided
        if (!$this->has('progress')) {
            $this->merge([
                'progress' => 0,
            ]);
        }
    }
}