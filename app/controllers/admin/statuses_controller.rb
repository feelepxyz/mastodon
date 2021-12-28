# frozen_string_literal: true

module Admin
  class StatusesController < BaseController
    helper_method :current_params

    before_action :set_account, except: :create

    PER_PAGE = 20

    def index
      authorize :status, :index?

      @statuses = @account.statuses.where(visibility: [:public, :unlisted])

      if params[:media]
        @statuses = @statuses.merge(Status.joins(:media_attachments).merge(@account.media_attachments.reorder(nil)).group(:id)).reorder('statuses.id desc')
      end

      @statuses = @statuses.preload(:media_attachments, :mentions).page(params[:page]).per(PER_PAGE)
      @status_batch_action = Admin::StatusBatchAction.new
    end

    def show
      authorize :status, :index?

      @statuses = @account.statuses.where(id: params[:id])
      authorize @statuses.first, :show?

      @status_batch_action = Admin::StatusBatchAction.new
    end

    def create
      @status_batch_action = Admin::StatusBatchAction.new(admin_status_batch_action_params.merge(current_account: current_account, report_id: params[:report_id], type: action_from_button))
      @status_batch_action.save!
    rescue ActionController::ParameterMissing
      flash[:alert] = I18n.t('admin.statuses.no_status_selected')
    ensure
      redirect_to after_create_redirect_path
    end

    private

    def admin_status_batch_action_params
      params.require(:admin_status_batch_action).permit(status_ids: [])
    end

    def after_create_redirect_path
      if params[:report_id]
        admin_report_path(params[:report_id])
      else
        admin_account_statuses_path(params[:account_id], current_params)
      end
    end

    def set_account
      @account = Account.find(params[:account_id])
    end

    def current_params
      page = (params[:page] || 1).to_i

      {
        media: params[:media],
        page: page > 1 && page,
        report_id: params[:report_id],
      }.select { |_, value| value.present? }
    end

    def action_from_button
      if params[:report]
        'report'
      elsif params[:remove_from_report]
        'remove_from_report'
      elsif params[:delete]
        'delete'
      end
    end
  end
end
