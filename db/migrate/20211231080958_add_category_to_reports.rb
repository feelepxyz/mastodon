require Rails.root.join('lib', 'mastodon', 'migration_helpers')

class AddCategoryToReports < ActiveRecord::Migration[6.1]
  include Mastodon::MigrationHelpers

  disable_ddl_transaction!

  def up
    safety_assured { add_column_with_default :reports, :category, :int, default: 0, allow_null: false }
    add_column :reports, :action_taken_at, :datetime
    add_column :reports, :rule_ids, :bigint, array: true
    safety_assured { execute 'UPDATE reports SET action_taken_at = updated_at WHERE action_taken = TRUE' }
  end

  def down
    remove_column :reports, :category
    remove_column :reports, :action_taken_by_account_id
    remove_column :reports, :rule_ids
  end
end
